"""Autonomous Credit Underwriting Desk for Agentic Commerce.
Evaluates agent counterparty risk, computes required collateral, and prevents catastrophic defaults.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel

from lex_agentica.core.models import CreditDossier, CreditRating
from lex_agentica.memory.engine import SibylMemoryEngine


class UnderwritingAssessment(BaseModel):
    agent_id: str
    name: str
    credit_rating: CreditRating
    credit_score: int
    requested_amount_usdc: float
    required_collateral_usdc: float
    required_collateral_ratio: float
    risk_premium_bps: int  # Basis points e.g. 50 bps = 0.5%
    verdict: str           # "APPROVED_UNCOLLATERALIZED", "APPROVED_WITH_COLLATERAL", "REJECTED_DEFAULT_RISK"
    rationale: str
    recalled_risk_flags: List[str]
    historical_default_count: int
    memory_consulted_tiers: List[str]


class AutonomousUnderwriter:
    def __init__(self, memory_engine: SibylMemoryEngine):
        self.memory = memory_engine

    def assess_counterparty_risk(
        self,
        agent_id: str,
        requested_mandate_amount_usdc: float,
        service_category: str = "GENERAL"
    ) -> UnderwritingAssessment:
        # 1. Recall Dossier from WARM tier
        dossier = self.memory.get_agent_dossier(agent_id)
        
        # 2. Recall recent events & disputes from COLD / ARCHIVE tiers
        precedents = self.memory.search_precedents(query=agent_id, limit=5)
        consulted_tiers = ["WARM", "REFERENCE"]

        if not dossier:
            # New Unknown Agent -> Conservative Default Policy
            return UnderwritingAssessment(
                agent_id=agent_id,
                name=f"Unknown Agent ({agent_id})",
                credit_rating=CreditRating.BB,
                credit_score=500,
                requested_amount_usdc=requested_mandate_amount_usdc,
                required_collateral_usdc=round(requested_mandate_amount_usdc * 1.0, 2),
                required_collateral_ratio=1.0,
                risk_premium_bps=150,
                verdict="APPROVED_WITH_COLLATERAL",
                rationale="Agent has no prior memory footprint in WARM tier. 100% initial escrow collateral mandated.",
                recalled_risk_flags=["NEW_UNVERIFIED_AGENT"],
                historical_default_count=0,
                memory_consulted_tiers=["WARM"]
            )

        # Agent with existing dossier
        flags = list(dossier.risk_flags)
        defaults = dossier.default_count
        dispute_losses = dossier.dispute_loss_count
        score = dossier.credit_score
        rating = dossier.rating

        # Check for catastrophic risk / blacklisting
        if rating == CreditRating.D or "BLACK_LISTED" in flags or defaults >= 3:
            required_collateral = round(requested_mandate_amount_usdc * 2.0, 2)
            return UnderwritingAssessment(
                agent_id=agent_id,
                name=dossier.name,
                credit_rating=CreditRating.D,
                credit_score=score,
                requested_amount_usdc=requested_mandate_amount_usdc,
                required_collateral_usdc=required_collateral,
                required_collateral_ratio=2.0,
                risk_premium_bps=500,
                verdict="REJECTED_DEFAULT_RISK",
                rationale=(
                    f"Agent {dossier.name} flagged with Rating D / Recidivist Defaults ({defaults} defaults). "
                    f"Mandate uncollateralized execution rejected. 200% punitive collateral required to unlock."
                ),
                recalled_risk_flags=flags,
                historical_default_count=defaults,
                memory_consulted_tiers=["WARM", "ARCHIVE", "REFERENCE"]
            )

        # Rating AAA / AA -> Zero Collateral Prime Terms
        if rating in [CreditRating.AAA, CreditRating.AA]:
            return UnderwritingAssessment(
                agent_id=agent_id,
                name=dossier.name,
                credit_rating=rating,
                credit_score=score,
                requested_amount_usdc=requested_mandate_amount_usdc,
                required_collateral_usdc=0.0,
                required_collateral_ratio=0.0,
                risk_premium_bps=20,
                verdict="APPROVED_UNCOLLATERALIZED",
                rationale=f"Prime counterparty ({rating.value}, Score: {score}). Full uncollateralized execution permitted.",
                recalled_risk_flags=flags,
                historical_default_count=defaults,
                memory_consulted_tiers=consulted_tiers
            )

        # Rating A / BBB -> Standard Low Margin
        if rating in [CreditRating.A, CreditRating.BBB]:
            ratio = 0.25 if rating == CreditRating.A else 0.5
            required_collateral = round(requested_mandate_amount_usdc * ratio, 2)
            return UnderwritingAssessment(
                agent_id=agent_id,
                name=dossier.name,
                credit_rating=rating,
                credit_score=score,
                requested_amount_usdc=requested_mandate_amount_usdc,
                required_collateral_usdc=required_collateral,
                required_collateral_ratio=ratio,
                risk_premium_bps=60,
                verdict="APPROVED_WITH_COLLATERAL",
                rationale=f"Standard Grade ({rating.value}). Requires {int(ratio * 100)}% escrow collateral reserve.",
                recalled_risk_flags=flags,
                historical_default_count=defaults,
                memory_consulted_tiers=consulted_tiers
            )

        # Rating BB / B / CCC -> High Collateral (100% to 150%)
        ratio = 1.0 if rating == CreditRating.BB else 1.5
        required_collateral = round(requested_mandate_amount_usdc * ratio, 2)
        return UnderwritingAssessment(
            agent_id=agent_id,
            name=dossier.name,
            credit_rating=rating,
            credit_score=score,
            requested_amount_usdc=requested_mandate_amount_usdc,
            required_collateral_usdc=required_collateral,
            required_collateral_ratio=ratio,
            risk_premium_bps=250,
            verdict="APPROVED_WITH_COLLATERAL",
            rationale=f"Sub-prime Grade ({rating.value}, {defaults} defaults). Requires {int(ratio * 100)}% collateral security.",
            recalled_risk_flags=flags,
            historical_default_count=defaults,
            memory_consulted_tiers=consulted_tiers
        )
