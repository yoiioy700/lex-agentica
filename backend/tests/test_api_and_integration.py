"""Integration and End-to-End Test Suite for Lex Agentica.
Tests API routes, Base Sepolia escrow, Virtuals ACP signature validation, and multi-scenario Litmus tests.
"""

from fastapi.testclient import TestClient
import pytest

from lex_agentica.api.server import app, memory_engine
from lex_agentica.core.models import MandateStatus, RulingType
from lex_agentica.onchain.escrow_client import BaseEscrowClient
from lex_agentica.simulator.litmus_test import LitmusBenchmarkRunner
from lex_agentica.virtuals.acp import VirtualsACPCoordinator, ACPMessageType


client = TestClient(app)


class TestApiAndIntegration:

    def setup_method(self):
        memory_engine.reset_to_clean_state()

    def test_status_endpoint(self):
        resp = client.get("/api/status")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "OPERATIONAL"
        assert data["partner_multipliers"]["total_effective_multiplier"] == 1.25
        assert data["load_bearing_gate"]["status"] == "VERIFIED"
        assert "HOT" in data["memory_tier_counts"]

    def test_memory_search_and_tiers_endpoints(self):
        # 1. Fetch tiers
        resp = client.get("/api/memory/tiers")
        assert resp.status_code == 200
        data = resp.json()
        assert "counts" in data
        assert "records" in data
        assert "REFERENCE" in data["records"]
        assert len(data["records"]["REFERENCE"]) >= 5

        # 2. Search statutes
        search_resp = client.get("/api/memory/search?q=latency")
        assert search_resp.status_code == 200
        search_data = search_resp.json()
        assert search_data["count"] > 0
        assert any("A2A-§401" in str(r) for r in search_data["results"])

    def test_underwrite_endpoint(self):
        resp = client.post(
            "/api/underwrite",
            json={
                "agent_id": "agent_alpha_data",
                "amount_usdc": 5000.0,
                "category": "DATA_ORACLE"
            }
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["agent_id"] == "agent_alpha_data"
        assert data["credit_rating"] == "AAA"
        assert data["required_collateral_usdc"] == 0.0
        assert data["verdict"] == "APPROVED_UNCOLLATERALIZED"

    def test_create_mandate_and_onchain_settlement_e2e(self):
        # 1. Create a mandate
        create_resp = client.post(
            "/api/mandates",
            json={
                "title": "Alpha Real-Time Crypto Orderbook Feed",
                "buyer_agent_id": "agent_client_apex",
                "worker_agent_id": "agent_alpha_data",
                "amount_usdc": 3000.0,
                "category": "DATA_ORACLE",
                "max_latency_ms": 2000,
                "required_accuracy_pct": 99.0
            }
        )
        assert create_resp.status_code == 200
        mandate_data = create_resp.json()
        mandate_id = mandate_data["mandate"]["mandate_id"]
        assert mandate_data["onchain_receipt"]["event_name"] == "MandateCreated"
        assert mandate_data["onchain_receipt"]["tx_hash"].startswith("0x")
        assert mandate_data["acp_packet"]["protocol_version"] == "ACP/2.0"

        # 2. Verify it is stored in HOT memory tier
        hot_mandate = memory_engine.get_hot_mandate(mandate_id)
        assert hot_mandate is not None
        assert hot_mandate.amount_usdc == 3000.0

        # 3. File dispute and adjudicate
        disp_resp = client.post(
            "/api/disputes/adjudicate",
            json={
                "mandate_id": mandate_id,
                "plaintiff_agent_id": "agent_client_apex",
                "defendant_agent_id": "agent_alpha_data",
                "reason": "Data feed had 12,000ms delay exceeding SLA",
                "alleged_breach_code": "A2A-§401",
                "actual_latency_ms": 12000,
                "actual_accuracy_pct": 99.0,
                "has_malicious_payload": False
            }
        )
        assert disp_resp.status_code == 200
        disp_data = disp_resp.json()
        ruling = disp_data["ruling"]
        assert ruling["ruling_type"] == RulingType.PLAINTIFF_FULL_REFUND.value
        assert ruling["slash_percentage"] == 100.0
        assert ruling["plaintiff_award_usdc"] == 3000.0
        assert disp_data["onchain_receipt"]["event_name"] == "DisputeResolved"

        # 4. Check on-chain transactions feed
        tx_resp = client.get("/api/onchain/transactions")
        assert tx_resp.status_code == 200
        txs = tx_resp.json()
        assert len(txs) >= 2

        # 5. Check Virtuals ACP message log
        acp_resp = client.get("/api/virtuals/messages")
        assert acp_resp.status_code == 200
        messages = acp_resp.json()
        assert len(messages) >= 2

    def test_virtuals_acp_signature_verification(self):
        coordinator = VirtualsACPCoordinator()
        packet = coordinator.create_acp_packet(
            msg_type=ACPMessageType.PROPOSAL_QUOTE,
            sender_id="agent_alpha_data",
            recipient_id="agent_client_apex",
            session_id="SESSION-001",
            payload={"quote_usdc": 1200.0, "sla_latency_ms": 1500}
        )
        assert coordinator.verify_message_signature(packet) is True

        # Tampered payload should fail verification
        tampered_packet = packet.model_copy(deep=True)
        tampered_packet.payload["quote_usdc"] = 999999.0
        assert coordinator.verify_message_signature(tampered_packet) is False

    def test_multi_scenario_litmus_benchmark(self):
        runner = LitmusBenchmarkRunner()

        # Scenario 1: Recidivism
        rep_1 = runner.run_benchmark("RECIDIVISM")
        assert rep_1.gate_passed is True
        assert rep_1.capital_loss_prevented_usdc >= 10000.0
        assert len(rep_1.steps) == 3

        # Scenario 2: Precedent
        rep_2 = runner.run_benchmark("PRECEDENT")
        assert rep_2.gate_passed is True
        assert len(rep_2.statutes_invoked) >= 1

        # Scenario 3: Contagion
        rep_3 = runner.run_benchmark("CONTAGION")
        assert rep_3.gate_passed is True
        assert rep_3.capital_loss_prevented_usdc >= 20000.0

    def test_economy_simulation_endpoints(self):
        # 1. Check initial simulation status
        status_resp = client.get("/api/simulation/status")
        assert status_resp.status_code == 200
        assert "is_running" in status_resp.json()

        # 2. Trigger single step
        step_resp = client.post("/api/simulation/step")
        assert step_resp.status_code == 200
        step_data = step_resp.json()
        assert step_data["status"] == "SUCCESS"
        assert "step_result" in step_data
        assert step_data["step_result"]["event_type"] in ["INSTANT_PAYOUT", "DISPUTE_SLASHED"]

        # 3. Start background simulation
        start_resp = client.post("/api/simulation/start", json={"interval_seconds": 1.0})
        assert start_resp.status_code == 200
        assert start_resp.json()["simulation_running"] is True

        # 4. Stop simulation
        stop_resp = client.post("/api/simulation/stop")
        assert stop_resp.status_code == 200
        assert stop_resp.json()["simulation_running"] is False
