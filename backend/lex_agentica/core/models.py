from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class MemoryTier(str, Enum):
    HOT = "HOT"
    WARM = "WARM"
    COLD = "COLD"
    REFERENCE = "REFERENCE"
    ARCHIVE = "ARCHIVE"


class MandateStatus(str, Enum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    DISPUTED = "DISPUTED"
    RESOLVED = "RESOLVED"
    CANCELLED = "CANCELLED"


class RulingType(str, Enum):
    PLAINTIFF_FULL_REFUND = "PLAINTIFF_FULL_REFUND"      # Worker 100% slashed
    DEFENDANT_FULL_PAYOUT = "DEFENDANT_FULL_PAYOUT"      # Worker exonerated, 100% paid
    PARTIAL_SPLIT = "PARTIAL_SPLIT"                      # Pro-rata delivery allocation
    REJECTED = "REJECTED"                                # Frivolous claim


class CreditRating(str, Enum):
    AAA = "AAA"  # Prime / Autonomous Bluechip
    AA = "AA"    # High Grade
    A = "A"      # Upper Medium Grade
    BBB = "BBB"  # Medium Grade
    BB = "BB"    # Speculative Grade
    B = "B"      # Highly Speculative
    CCC = "CCC"  # Substantial Risk / Default Imminent
    D = "D"      # In Default / Blacklisted


class SLA(BaseModel):
    category: str = Field(..., description="Service Category e.g. DATA_SCRAPING, ORACLE_PRICE, INFERENCE")
    max_latency_ms: int = Field(default=5000, description="Max acceptable response time in ms")
    required_accuracy_pct: float = Field(default=95.0, description="Required accuracy percentage")
    schema_version: str = Field(default="1.0.0")
    custom_rules: Dict[str, Any] = Field(default_factory=dict)


class Mandate(BaseModel):
    mandate_id: str
    buyer_agent_id: str
    worker_agent_id: str
    title: str
    amount_usdc: float
    required_collateral_usdc: float = 0.0
    sla: SLA
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    deadline_ts: str
    status: MandateStatus = MandateStatus.ACTIVE
    deliverable_hash: Optional[str] = None
    escrow_tx_hash: Optional[str] = None
    settlement_tx_hash: Optional[str] = None


class DisputeClaim(BaseModel):
    claim_id: str
    mandate_id: str
    plaintiff_agent_id: str
    defendant_agent_id: str
    reason: str
    alleged_breach_code: str = "A2A-§401"
    evidence_payload: Dict[str, Any] = Field(default_factory=dict)
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class CaseRuling(BaseModel):
    case_id: str
    mandate_id: str
    ruling_type: RulingType
    slash_percentage: float  # 0.0 to 100.0
    plaintiff_award_usdc: float
    defendant_award_usdc: float
    legal_rationale: str
    cited_statutes: List[str] = Field(default_factory=list)
    cited_precedents: List[str] = Field(default_factory=list)
    onchain_tx_hash: Optional[str] = None
    adjudicated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class CreditDossier(BaseModel):
    agent_id: str
    name: str
    credit_score: int = Field(ge=0, le=1000, default=750)
    rating: CreditRating = CreditRating.A
    total_deals: int = 0
    successful_deals: int = 0
    default_count: int = 0
    dispute_loss_count: int = 0
    total_volume_usdc: float = 0.0
    required_collateral_ratio: float = 0.0  # Multiplier e.g. 0.0 (no collateral), 1.0 (100%), 2.0 (200%)
    max_credit_limit_usdc: float = 10000.0
    risk_flags: List[str] = Field(default_factory=list)
    last_updated: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class MemoryRecord(BaseModel):
    id: str
    tier: MemoryTier
    title: str
    content: str
    entity_id: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class LitmusTestStep(BaseModel):
    step_name: str
    description: str
    memory_on_action: str
    memory_off_action: str
    divergence_explained: str
    loss_prevented_usdc: float = 0.0


class LitmusTestReport(BaseModel):
    test_id: str
    scenario_title: str
    gate_passed: bool
    cold_start_recall_ms: float
    capital_loss_prevented_usdc: float
    memory_on_outcome: str
    memory_off_failure_mode: str
    steps: List[LitmusTestStep]
    statutes_invoked: List[str]
    precedents_recalled: List[str]
