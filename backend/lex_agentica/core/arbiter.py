"""Autonomous Legal Arbiter for Agentic Commerce.
Performs precedent-aware adjudication using Sibyl's 5-Tier Memory & SQLite FTS5.
"""

from datetime import datetime, timezone
import hashlib
import time
from typing import Dict, List, Optional, Tuple

from lex_agentica.core.models import (
    CaseRuling,
    CreditDossier,
    CreditRating,
    DisputeClaim,
    Mandate,
    MandateStatus,
    RulingType
)
from lex_agentica.memory.engine import SibylMemoryEngine


class AutonomousArbiter:
    def __init__(self, memory_engine: SibylMemoryEngine):
        self.memory = memory_engine

    def adjudicate_dispute(
        self,
        mandate: Mandate,
        claim: DisputeClaim,
        evidence: Optional[Dict] = None
    ) -> CaseRuling:
        case_id = f"CASE-{int(time.time())}-{claim.claim_id[-4:]}"
        combined_evidence = {**claim.evidence_payload, **(evidence or {})}

        # 1. Recall Statutes from REFERENCE tier via FTS5
        statute_search = self.memory.search_statutes(
            query=f"{claim.reason} {claim.alleged_breach_code} {mandate.sla.category}",
            limit=3
        )
        cited_statutes = [s["entity_id"] for s in statute_search if "entity_id" in s]
        if claim.alleged_breach_code not in cited_statutes:
            cited_statutes.append(claim.alleged_breach_code)

        # 2. Recall Precedents from ARCHIVE tier via FTS5
        precedent_search = self.memory.search_precedents(
            query=f"{claim.reason} {claim.alleged_breach_code}",
            limit=3
        )
        cited_precedents = [p["entity_id"] for p in precedent_search if "entity_id" in p]

        # 3. Check Defendant & Plaintiff reputation from WARM tier
        worker_dossier = self.memory.get_agent_dossier(mandate.worker_agent_id)
        buyer_dossier = self.memory.get_agent_dossier(mandate.buyer_agent_id)

        # 4. Judicial Evidence Evaluation
        ruling_type, slash_pct, rationale = self._evaluate_evidence(
            mandate=mandate,
            claim=claim,
            evidence=combined_evidence,
            worker_dossier=worker_dossier,
            buyer_dossier=buyer_dossier,
            statutes=statute_search,
            precedents=precedent_search
        )

        # Calculate funds allocation
        total_escrow = mandate.amount_usdc
        plaintiff_award = round(total_escrow * (slash_pct / 100.0), 2)
        defendant_award = round(total_escrow - plaintiff_award, 2)

        # Generate on-chain settlement proof hash (Base Sepolia compatible)
        raw_proof = f"{case_id}|{mandate.mandate_id}|{slash_pct}|{plaintiff_award}|{defendant_award}"
        tx_hash = "0x" + hashlib.sha256(raw_proof.encode()).hexdigest()

        ruling = CaseRuling(
            case_id=case_id,
            mandate_id=mandate.mandate_id,
            ruling_type=ruling_type,
            slash_percentage=slash_pct,
            plaintiff_award_usdc=plaintiff_award,
            defendant_award_usdc=defendant_award,
            legal_rationale=rationale,
            cited_statutes=cited_statutes,
            cited_precedents=cited_precedents,
            onchain_tx_hash=tx_hash,
            adjudicated_at=datetime.now(timezone.utc).isoformat()
        )

        # 5. Persist ruling into ARCHIVE tier
        self.memory.archive_case_ruling(ruling)

        # 6. Update WARM tier credit dossiers
        self._update_dossiers_post_ruling(ruling, mandate, worker_dossier, buyer_dossier)

        # 7. Log to COLD journal
        self.memory.log_cold_journal_event(
            event_type="DISPUTE_ADJUDICATION",
            tx_hash=tx_hash,
            description=f"Case {case_id} adjudicated with {slash_pct}% slash. Rationale: {rationale[:60]}...",
            entity_id=mandate.mandate_id,
            payload=ruling.model_dump()
        )

        # 8. Update HOT mandate status
        mandate.status = MandateStatus.RESOLVED
        mandate.settlement_tx_hash = tx_hash
        self.memory.put_hot_mandate(mandate)

        return ruling

    def _evaluate_evidence(
        self,
        mandate: Mandate,
        claim: DisputeClaim,
        evidence: Dict,
        worker_dossier: Optional[CreditDossier],
        buyer_dossier: Optional[CreditDossier],
        statutes: List[Dict],
        precedents: List[Dict]
    ) -> Tuple[RulingType, float, str]:
        # Case A: Malicious Code / Exploit
        if evidence.get("has_malicious_payload") or "A2A-§403" in claim.alleged_breach_code:
            rationale = (
                f"Pursuant to Statute A2A-§403, submission contained verified malicious payload or prompt injection. "
                f"Immediate 100% slash and blacklisting applied."
            )
            return RulingType.PLAINTIFF_FULL_REFUND, 100.0, rationale

        # Case B: Latency / Freshness Breach
        actual_latency = evidence.get("actual_latency_ms", 0)
        sla_latency = mandate.sla.max_latency_ms
        if actual_latency > (sla_latency * 1.5):
            # Material delay
            precedent_citation = f" Supported by precedent {precedents[0]['entity_id']}." if precedents else ""
            rationale = (
                f"Pursuant to Statute A2A-§401, deliverable latency of {actual_latency}ms severely exceeded SLA threshold "
                f"of {sla_latency}ms (>150%). Material breach established.{precedent_citation}"
            )
            return RulingType.PLAINTIFF_FULL_REFUND, 100.0, rationale

        # Case C: Partial / Substandard Delivery
        actual_accuracy = evidence.get("actual_accuracy_pct", 100.0)
        required_accuracy = mandate.sla.required_accuracy_pct
        if actual_accuracy < required_accuracy:
            if actual_accuracy >= 70.0:
                # Pro-rata delivery pursuant to §402
                slash_pct = round(100.0 - actual_accuracy, 1)
                rationale = (
                    f"Pursuant to Statute A2A-§402 (Substandard Delivery & Pro-Rata Allocation), deliverable achieved "
                    f"{actual_accuracy}% accuracy vs required {required_accuracy}%. Equitable split awarded: "
                    f"{slash_pct}% refunded to Buyer, {100.0 - slash_pct}% released to Worker."
                )
                return RulingType.PARTIAL_SPLIT, slash_pct, rationale
            else:
                # Severe substandard (<70%)
                rationale = (
                    f"Pursuant to Statute A2A-§401/§402, deliverable accuracy of {actual_accuracy}% is unacceptably low (<70%). "
                    f"Full 100% refund awarded to Plaintiff."
                )
                return RulingType.PLAINTIFF_FULL_REFUND, 100.0, rationale

        # Case D: Frivolous Claim (Worker met SLA)
        rationale = (
            f"Pursuant to Statute A2A-§404, Worker deliverable met all contractual SLA criteria. "
            f"Dispute dismissed. 100% escrow payout awarded to Worker."
        )
        return RulingType.DEFENDANT_FULL_PAYOUT, 0.0, rationale

    def _update_dossiers_post_ruling(
        self,
        ruling: CaseRuling,
        mandate: Mandate,
        worker_dossier: Optional[CreditDossier],
        buyer_dossier: Optional[CreditDossier]
    ) -> None:
        if worker_dossier:
            worker_dossier.total_deals += 1
            if ruling.slash_percentage >= 50.0:
                worker_dossier.dispute_loss_count += 1
                worker_dossier.default_count += (1 if ruling.slash_percentage == 100.0 else 0)
                # Downgrade credit score
                score_penalty = int(ruling.slash_percentage * 1.5)
                worker_dossier.credit_score = max(100, worker_dossier.credit_score - score_penalty)
                worker_dossier.rating = self._calculate_rating(worker_dossier.credit_score)
                worker_dossier.required_collateral_ratio = min(2.0, worker_dossier.required_collateral_ratio + 0.5)
                if "SLA_BREACH_PENALIZED" not in worker_dossier.risk_flags:
                    worker_dossier.risk_flags.append("SLA_BREACH_PENALIZED")
                if worker_dossier.credit_score < 500:
                    if "UNCOLLATERALIZED_PROHIBITED" not in worker_dossier.risk_flags:
                        worker_dossier.risk_flags.append("UNCOLLATERALIZED_PROHIBITED")
            else:
                worker_dossier.successful_deals += 1
                worker_dossier.credit_score = min(1000, worker_dossier.credit_score + 10)
                worker_dossier.rating = self._calculate_rating(worker_dossier.credit_score)
            
            worker_dossier.last_updated = datetime.now(timezone.utc).isoformat()
            self.memory.save_agent_dossier(worker_dossier)

        if buyer_dossier:
            buyer_dossier.total_deals += 1
            if ruling.ruling_type == RulingType.DEFENDANT_FULL_PAYOUT:
                # Frivolous dispute penalty
                buyer_dossier.credit_score = max(100, buyer_dossier.credit_score - 25)
                buyer_dossier.rating = self._calculate_rating(buyer_dossier.credit_score)
                if "FRIVOLOUS_DISPUTE_FILED" not in buyer_dossier.risk_flags:
                    buyer_dossier.risk_flags.append("FRIVOLOUS_DISPUTE_FILED")
            buyer_dossier.last_updated = datetime.now(timezone.utc).isoformat()
            self.memory.save_agent_dossier(buyer_dossier)

    @staticmethod
    def _calculate_rating(score: int) -> CreditRating:
        if score >= 850:
            return CreditRating.AAA
        elif score >= 780:
            return CreditRating.AA
        elif score >= 700:
            return CreditRating.A
        elif score >= 620:
            return CreditRating.BBB
        elif score >= 540:
            return CreditRating.BB
        elif score >= 460:
            return CreditRating.B
        elif score >= 350:
            return CreditRating.CCC
        else:
            return CreditRating.D
