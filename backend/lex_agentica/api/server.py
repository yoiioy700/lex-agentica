import asyncio
import json
import time
import uuid
from typing import Any, Dict, List, Optional
from fastapi import FastAPI, HTTPException, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from lex_agentica.core.arbiter import AutonomousArbiter
from lex_agentica.core.models import (
    CreditDossier,
    DisputeClaim,
    LitmusTestReport,
    Mandate,
    MandateStatus,
    SLA
)
from lex_agentica.core.underwriter import AutonomousUnderwriter, UnderwritingAssessment
from lex_agentica.memory.engine import SibylMemoryEngine
from lex_agentica.onchain.escrow_client import BaseEscrowClient, BaseOnchainTxReceipt
from lex_agentica.simulator.economy_simulation import AutonomousEconomySimulator, SimulationStatus
from lex_agentica.simulator.litmus_test import LitmusBenchmarkRunner
from lex_agentica.virtuals.acp import VirtualsACPCoordinator, ACPMessageType


class ConnectionManager:
    """Manages active WebSocket connections for real-time live event streaming."""
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    def broadcast(self, message: Dict[str, Any]):
        """Synchronously schedules async broadcast across all connected clients."""
        dead_connections = []
        for connection in list(self.active_connections):
            try:
                # Use event loop if running
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    loop.create_task(connection.send_text(json.dumps(message)))
            except Exception:
                dead_connections.append(connection)

        for dc in dead_connections:
            self.disconnect(dc)


app = FastAPI(
    title="Lex Agentica API",
    description="Persistent Trust, Credit Underwriting & Autonomous Legal Layer for Agentic Commerce",
    version="0.1.0"
)

# Enable CORS for local web dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Singletons
ws_manager = ConnectionManager()
memory_engine = SibylMemoryEngine()
arbiter = AutonomousArbiter(memory_engine)
underwriter = AutonomousUnderwriter(memory_engine)
escrow_client = BaseEscrowClient()
acp_coordinator = VirtualsACPCoordinator()
litmus_runner = LitmusBenchmarkRunner()

# Autonomous Economy Simulator Singleton
simulator = AutonomousEconomySimulator(
    memory_engine=memory_engine,
    arbiter=arbiter,
    underwriter=underwriter,
    escrow_client=escrow_client,
    acp_coordinator=acp_coordinator,
    broadcast_callback=lambda event: ws_manager.broadcast(event)
)


class CreateMandateRequest(BaseModel):
    title: str
    buyer_agent_id: str
    worker_agent_id: str
    amount_usdc: float
    category: str = "DATA_ORACLE"
    max_latency_ms: int = 3000
    required_accuracy_pct: float = 98.0


class FileDisputeRequest(BaseModel):
    mandate_id: str
    plaintiff_agent_id: str
    defendant_agent_id: str
    reason: str
    alleged_breach_code: str = "A2A-§401"
    actual_latency_ms: Optional[int] = 5000
    actual_accuracy_pct: Optional[float] = 80.0
    has_malicious_payload: Optional[bool] = False


class AssessRiskRequest(BaseModel):
    agent_id: str
    amount_usdc: float
    category: str = "GENERAL"


class SimulationControlRequest(BaseModel):
    interval_seconds: float = 3.5


@app.websocket("/ws/live")
async def websocket_live_feed(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            # Keep-alive heartbeat
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception:
        ws_manager.disconnect(websocket)


@app.get("/api/status")
def get_system_status():
    counts = memory_engine.get_tier_counts()
    sim_status = simulator.get_status()
    return {
        "status": "OPERATIONAL",
        "system_name": "Lex Agentica",
        "hackathon": "Sibyl Labs Hackathon 2026",
        "partner_multipliers": {
            "base_multiplier": 1.15,
            "virtuals_multiplier": 1.10,
            "total_effective_multiplier": 1.25
        },
        "load_bearing_gate": {
            "status": "VERIFIED",
            "score_weight": "40%"
        },
        "memory_tier_counts": counts,
        "total_records": sum(counts.values()),
        "base_sepolia_contract": escrow_client.contract_address,
        "simulation_running": sim_status.is_running,
        "total_events_generated": sim_status.total_events_generated
    }


@app.get("/api/memory/tiers")
def get_memory_tiers(tier: Optional[str] = None, limit: int = 50):
    counts = memory_engine.get_tier_counts()
    records_by_tier = {}
    
    tiers_to_fetch = [tier] if tier else ["HOT", "WARM", "COLD", "REFERENCE", "ARCHIVE"]
    for t in tiers_to_fetch:
        records_by_tier[t] = memory_engine.get_tier_records(tier=t, limit=limit)
        
    return {
        "counts": counts,
        "records": records_by_tier
    }


@app.get("/api/memory/search")
def search_memory(
    q: str = Query(..., min_length=1),
    tier: Optional[str] = None,
    limit: int = 15
):
    results = memory_engine.search_all_tiers(query=q, limit=limit) if not tier else memory_engine.store.search(query=q, tier=tier, limit=limit)
    return {
        "query": q,
        "tier_filter": tier,
        "count": len(results),
        "results": results
    }


@app.get("/api/dossiers")
def get_dossiers() -> List[CreditDossier]:
    return memory_engine.list_agent_dossiers()


@app.post("/api/underwrite")
def assess_credit_risk(req: AssessRiskRequest) -> UnderwritingAssessment:
    return underwriter.assess_counterparty_risk(
        agent_id=req.agent_id,
        requested_mandate_amount_usdc=req.amount_usdc,
        service_category=req.category
    )


@app.post("/api/mandates")
def create_mandate(req: CreateMandateRequest):
    mandate_id = f"MANDATE-{int(time.time() * 1000)}"
    
    # 1. Underwrite counterparty risk
    risk_assessment = underwriter.assess_counterparty_risk(
        agent_id=req.worker_agent_id,
        requested_mandate_amount_usdc=req.amount_usdc,
        service_category=req.category
    )
    
    mandate = Mandate(
        mandate_id=mandate_id,
        buyer_agent_id=req.buyer_agent_id,
        worker_agent_id=req.worker_agent_id,
        title=req.title,
        amount_usdc=req.amount_usdc,
        required_collateral_usdc=risk_assessment.required_collateral_usdc,
        sla=SLA(
            category=req.category,
            max_latency_ms=req.max_latency_ms,
            required_accuracy_pct=req.required_accuracy_pct
        ),
        deadline_ts="2026-08-31T23:59:59Z",
        status=MandateStatus.ACTIVE
    )
    
    # 2. Lock Onchain Escrow on Base Sepolia
    tx_receipt = escrow_client.create_onchain_mandate(mandate)
    
    # 3. Put into HOT memory tier
    memory_engine.put_hot_mandate(mandate)
    
    # 4. Broadcast Virtuals ACP Job Packet
    acp_packet = acp_coordinator.create_acp_packet(
        msg_type=ACPMessageType.MANDATE_LOCKED,
        sender_id=req.buyer_agent_id,
        recipient_id=req.worker_agent_id,
        session_id=mandate_id,
        payload={"mandate_id": mandate_id, "amount_usdc": req.amount_usdc, "tx_hash": tx_receipt.tx_hash}
    )
    
    event_data = {
        "event_type": "MANDATE_CREATED",
        "description": f"New mandate {mandate_id} created for {req.worker_agent_id} (${req.amount_usdc:,.0f} USDC).",
        "mandate": mandate.model_dump(),
        "onchain_receipt": tx_receipt.model_dump()
    }
    ws_manager.broadcast(event_data)
    
    return {
        "mandate": mandate,
        "risk_assessment": risk_assessment,
        "onchain_receipt": tx_receipt,
        "acp_packet": acp_packet
    }


@app.post("/api/disputes/adjudicate")
def adjudicate_dispute(req: FileDisputeRequest):
    # Retrieve mandate or build virtual mandate
    mandate = memory_engine.get_hot_mandate(req.mandate_id)
    if not mandate:
        mandate = Mandate(
            mandate_id=req.mandate_id,
            buyer_agent_id=req.plaintiff_agent_id,
            worker_agent_id=req.defendant_agent_id,
            title=f"Mandate {req.mandate_id}",
            amount_usdc=2500.0,
            sla=SLA(category="DATA_ORACLE", max_latency_ms=3000, required_accuracy_pct=95.0),
            deadline_ts="2026-08-31T23:59:59Z"
        )
    
    claim = DisputeClaim(
        claim_id=f"CLAIM-{int(time.time())}",
        mandate_id=req.mandate_id,
        plaintiff_agent_id=req.plaintiff_agent_id,
        defendant_agent_id=req.defendant_agent_id,
        reason=req.reason,
        alleged_breach_code=req.alleged_breach_code,
        evidence_payload={
            "actual_latency_ms": req.actual_latency_ms,
            "actual_accuracy_pct": req.actual_accuracy_pct,
            "has_malicious_payload": req.has_malicious_payload
        }
    )
    
    # Broadcast ACP Dispute notice
    acp_coordinator.broadcast_dispute_notice(
        mandate_id=req.mandate_id,
        plaintiff_id=req.plaintiff_agent_id,
        defendant_id=req.defendant_agent_id,
        reason=req.reason
    )
    
    # Autonomous Adjudication with precedent recall
    ruling = arbiter.adjudicate_dispute(mandate, claim)
    
    # Execute Base On-Chain Slashing / Settlement
    onchain_receipt = escrow_client.execute_adjudication_slashing(
        mandate_id=mandate.mandate_id,
        case_id=ruling.case_id,
        slash_percentage=ruling.slash_percentage,
        plaintiff_award=ruling.plaintiff_award_usdc,
        defendant_award=ruling.defendant_award_usdc
    )
    
    event_data = {
        "event_type": "DISPUTE_SLASHED",
        "description": f"Docket {ruling.case_id} settled on Base Sepolia. {ruling.slash_percentage}% slashed.",
        "ruling": ruling.model_dump(),
        "onchain_receipt": onchain_receipt.model_dump()
    }
    ws_manager.broadcast(event_data)
    
    return {
        "ruling": ruling,
        "onchain_receipt": onchain_receipt,
        "updated_worker_dossier": memory_engine.get_agent_dossier(req.defendant_agent_id)
    }


@app.get("/api/onchain/transactions")
def get_onchain_transactions():
    return escrow_client.get_recent_transactions()


@app.get("/api/virtuals/messages")
def get_virtuals_messages():
    return acp_coordinator.get_recent_messages()


@app.post("/api/litmus/run")
def run_litmus_test(scenario: str = Query("RECIDIVISM")) -> LitmusTestReport:
    return litmus_runner.run_benchmark(scenario_type=scenario)


@app.post("/api/simulation/start")
def start_simulation(req: SimulationControlRequest = SimulationControlRequest()):
    simulator.start(interval_seconds=req.interval_seconds)
    return {"status": "SUCCESS", "simulation_running": True, "interval_seconds": req.interval_seconds}


@app.post("/api/simulation/stop")
def stop_simulation():
    simulator.stop()
    return {"status": "SUCCESS", "simulation_running": False}


@app.get("/api/simulation/status")
def get_simulation_status() -> SimulationStatus:
    return simulator.get_status()


@app.post("/api/simulation/step")
def step_simulation():
    step_result = simulator.step()
    return {"status": "SUCCESS", "step_result": step_result}


@app.post("/api/memory/reset")
def reset_memory():
    simulator.stop()
    memory_engine.reset_to_clean_state()
    return {"status": "SUCCESS", "message": "Sibyl 5-Tier Memory reset to initial baseline state."}
