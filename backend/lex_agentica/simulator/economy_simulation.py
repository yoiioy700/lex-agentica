"""Autonomous A2A Economy Traffic Simulator for Lex Agentica.
Simulates a live multi-agent commercial marketplace where autonomous agents continuously
negotiate contracts, fulfill work, commit occasional SLA breaches, and trigger on-chain settlements.
"""

import asyncio
from datetime import datetime, timezone
import random
import threading
import time
from typing import Any, Callable, Dict, List, Optional
from pydantic import BaseModel

from lex_agentica.core.arbiter import AutonomousArbiter
from lex_agentica.core.models import (
    CreditDossier,
    DisputeClaim,
    Mandate,
    MandateStatus,
    RulingType,
    SLA
)
from lex_agentica.core.underwriter import AutonomousUnderwriter
from lex_agentica.memory.engine import SibylMemoryEngine
from lex_agentica.onchain.escrow_client import BaseEscrowClient
from lex_agentica.virtuals.acp import VirtualsACPCoordinator, ACPMessageType


class SimulationStatus(BaseModel):
    is_running: bool
    total_events_generated: int
    active_mandates_count: int
    total_volume_settled_usdc: float
    total_slashed_usdc: float
    last_event_description: str
    last_event_timestamp: str


class AutonomousEconomySimulator:
    def __init__(
        self,
        memory_engine: SibylMemoryEngine,
        arbiter: AutonomousArbiter,
        underwriter: AutonomousUnderwriter,
        escrow_client: BaseEscrowClient,
        acp_coordinator: VirtualsACPCoordinator,
        broadcast_callback: Optional[Callable[[Dict[str, Any]], None]] = None
    ):
        self.memory = memory_engine
        self.arbiter = arbiter
        self.underwriter = underwriter
        self.escrow_client = escrow_client
        self.acp = acp_coordinator
        self.broadcast_callback = broadcast_callback

        self.is_running = False
        self._thread: Optional[threading.Thread] = None
        self.interval_seconds = 3.5
        self.total_events = 0
        self.total_settled_volume = 43700.0
        self.total_slashed_volume = 7500.0
        self.last_event_desc = "Simulation initialized in standby mode"
        self.last_event_ts = datetime.now(timezone.utc).isoformat()

        self._buyers = ["agent_client_apex", "agent_alpha_data"]
        self._workers = ["agent_alpha_data", "agent_beta_oracle", "agent_rogue_miner"]
        self._job_templates = [
            ("Real-Time Liquidity Arbitrage Feed", "DATA_ORACLE", 2000, 99.0, 2500.0),
            ("Autonomous LLM Code Synthesis Pipeline", "INFERENCE_WORK", 4000, 95.0, 4000.0),
            ("Cross-DEX Flash Loan Route Discovery", "DATA_ORACLE", 1500, 98.5, 3500.0),
            ("Decentralized Knowledge Graph Ingestion", "INFERENCE_WORK", 6000, 92.0, 1800.0),
            ("Security Anomaly Bytecode Audit", "SECURITY", 3000, 99.5, 5000.0)
        ]

    def start(self, interval_seconds: float = 3.5):
        if self.is_running:
            return
        self.is_running = True
        self.interval_seconds = interval_seconds
        self._thread = threading.Thread(target=self._run_loop, daemon=True)
        self._thread.start()

    def stop(self):
        self.is_running = False

    def get_status(self) -> SimulationStatus:
        counts = self.memory.get_tier_counts()
        return SimulationStatus(
            is_running=self.is_running,
            total_events_generated=self.total_events,
            active_mandates_count=counts.get("HOT", 0),
            total_volume_settled_usdc=self.total_settled_volume,
            total_slashed_usdc=self.total_slashed_volume,
            last_event_description=self.last_event_desc,
            last_event_timestamp=self.last_event_ts
        )

    def _run_loop(self):
        while self.is_running:
            try:
                self.step()
            except Exception as e:
                self.last_event_desc = f"Simulation event error: {str(e)}"
            time.sleep(self.interval_seconds)

    def step(self) -> Dict[str, Any]:
        """Executes a single autonomous economic step in the agent marketplace."""
        self.total_events += 1
        self.last_event_ts = datetime.now(timezone.utc).isoformat()

        buyer = random.choice(self._buyers)
        worker = random.choice(self._workers)
        while worker == buyer:
            worker = random.choice(self._workers)

        title, category, max_lat, req_acc, base_amt = random.choice(self._job_templates)
        mandate_id = f"SIM-MANDATE-{int(time.time() * 1000) % 1000000}"

        # 1. Underwrite Counterparty Risk
        assessment = self.underwriter.assess_counterparty_risk(
            agent_id=worker,
            requested_mandate_amount_usdc=base_amt,
            service_category=category
        )

        mandate = Mandate(
            mandate_id=mandate_id,
            buyer_agent_id=buyer,
            worker_agent_id=worker,
            title=title,
            amount_usdc=base_amt,
            required_collateral_usdc=assessment.required_collateral_usdc,
            sla=SLA(
                category=category,
                max_latency_ms=max_lat,
                required_accuracy_pct=req_acc
            ),
            deadline_ts="2026-08-31T23:59:59Z",
            status=MandateStatus.ACTIVE
        )

        # 2. Lock On-Chain Escrow on Base Sepolia
        tx_receipt = self.escrow_client.create_onchain_mandate(mandate)
        self.memory.put_hot_mandate(mandate)

        # 3. Broadcast Virtuals ACP v2.0 Packet
        acp_packet = self.acp.create_acp_packet(
            msg_type=ACPMessageType.MANDATE_LOCKED,
            sender_id=buyer,
            recipient_id=worker,
            session_id=mandate_id,
            payload={
                "mandate_id": mandate_id,
                "amount_usdc": base_amt,
                "required_collateral_usdc": assessment.required_collateral_usdc,
                "tx_hash": tx_receipt.tx_hash
            }
        )

        event_type = "MANDATE_CREATED"
        event_payload: Dict[str, Any] = {
            "mandate": mandate.model_dump(),
            "assessment": assessment.model_dump(),
            "onchain_receipt": tx_receipt.model_dump(),
            "acp_packet": acp_packet.model_dump()
        }

        # 4. Simulate Outcome: 75% Happy Path / 25% Dispute Breach
        is_breach = (worker == "agent_rogue_miner") or (random.random() < 0.25)

        if not is_breach:
            # Happy path: instant x402 release
            self.total_settled_volume += base_amt
            settle_tx = self.escrow_client.execute_x402_instant_payout(mandate_id, base_amt)
            mandate.status = MandateStatus.COMPLETED
            mandate.settlement_tx_hash = settle_tx.tx_hash
            self.memory.put_hot_mandate(mandate)

            # Update worker reputation positively in WARM tier
            worker_dossier = self.memory.get_agent_dossier(worker)
            if worker_dossier:
                worker_dossier.total_deals += 1
                worker_dossier.successful_deals += 1
                worker_dossier.total_volume_usdc += base_amt
                worker_dossier.credit_score = min(1000, worker_dossier.credit_score + 5)
                self.memory.save_agent_dossier(worker_dossier)

            self.last_event_desc = f"Mandate {mandate_id} fulfilled by {worker}. x402 settlement released (${base_amt:,.0f} USDC)."
            event_type = "INSTANT_PAYOUT"
            event_payload["settlement_receipt"] = settle_tx.model_dump()
        else:
            # Breach outcome: Autonomous Dispute Adjudication
            is_malicious = (worker == "agent_rogue_miner")
            breach_code = "A2A-§403" if is_malicious else "A2A-§401"
            reason = "Unauthorized bytecode probe exploit" if is_malicious else "Oracle deliverable exceeded max latency SLA threshold"

            claim = DisputeClaim(
                claim_id=f"CLAIM-{int(time.time()) % 100000}",
                mandate_id=mandate_id,
                plaintiff_agent_id=buyer,
                defendant_agent_id=worker,
                reason=reason,
                alleged_breach_code=breach_code,
                evidence_payload={
                    "actual_latency_ms": 14500 if not is_malicious else 4500,
                    "actual_accuracy_pct": 60.0 if not is_malicious else 95.0,
                    "has_malicious_payload": is_malicious
                }
            )

            # Broadcast ACP Dispute notice
            self.acp.broadcast_dispute_notice(mandate_id, buyer, worker, reason)

            # Autonomous Adjudication with Sibyl Precedent Recall
            ruling = self.arbiter.adjudicate_dispute(mandate, claim)
            self.total_slashed_volume += ruling.plaintiff_award_usdc

            # Base Sepolia Slashing
            slashing_tx = self.escrow_client.execute_adjudication_slashing(
                mandate_id=mandate_id,
                case_id=ruling.case_id,
                slash_percentage=ruling.slash_percentage,
                plaintiff_award=ruling.plaintiff_award_usdc,
                defendant_award=ruling.defendant_award_usdc
            )

            self.last_event_desc = f"Case {ruling.case_id} adjudicated: {worker} slashed {ruling.slash_percentage}%. (${ruling.plaintiff_award_usdc:,.0f} USDC refunded)."
            event_type = "DISPUTE_SLASHED"
            event_payload["ruling"] = ruling.model_dump()
            event_payload["slashing_receipt"] = slashing_tx.model_dump()

        result = {
            "event_type": event_type,
            "description": self.last_event_desc,
            "timestamp": self.last_event_ts,
            "data": event_payload
        }

        if self.broadcast_callback:
            try:
                self.broadcast_callback(result)
            except Exception:
                pass

        return result
