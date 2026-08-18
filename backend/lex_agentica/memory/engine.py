"""Sibyl 5-Tier Persistent Memory Engine for Lex Agentica.
Orchestrates HOT state, WARM entities, COLD journal, REFERENCE statutes, and ARCHIVE case law.
"""

from datetime import datetime, timezone
import json
from pathlib import Path
from typing import Any, Dict, List, Optional

from lex_agentica.core.models import (
    CreditDossier,
    CreditRating,
    MemoryRecord,
    MemoryTier,
    CaseRuling,
    Mandate
)
from lex_agentica.memory.fts_store import FTSStore
from lex_agentica.memory.statutes import DEFAULT_STATUTES, DEFAULT_INITIAL_PRECEDENTS


class SibylMemoryEngine:
    def __init__(self, db_path: Optional[str] = None):
        if db_path is None:
            # Default to persistent local sqlite database in scratch dir
            default_dir = Path(__file__).resolve().parent.parent.parent
            db_path = str(default_dir / "sibyl_memory.db")
            
        self.db_path = db_path
        self.store = FTSStore(db_path=self.db_path)
        self._seed_reference_and_initial_data()

    def _seed_reference_and_initial_data(self) -> None:
        """Seed Reference statutes and baseline known agent profiles if empty."""
        counts = self.store.count_by_tier()
        
        # Seed Reference Statutes
        if counts.get(MemoryTier.REFERENCE.value, 0) == 0:
            for statute in DEFAULT_STATUTES:
                self.store.insert_record(
                    record_id=f"STATUTE-{statute['code']}",
                    tier=MemoryTier.REFERENCE.value,
                    title=f"Statute {statute['code']}: {statute['title']}",
                    content=statute["content"],
                    entity_id=statute["code"],
                    tags=statute["tags"],
                    metadata={"category": statute["category"], "code": statute["code"]}
                )

        # Seed Initial Case Precedents in Archive
        if counts.get(MemoryTier.ARCHIVE.value, 0) == 0:
            for prec in DEFAULT_INITIAL_PRECEDENTS:
                self.store.insert_record(
                    record_id=f"PRECEDENT-{prec['case_id']}",
                    tier=MemoryTier.ARCHIVE.value,
                    title=f"Precedent {prec['case_id']}: {prec['title']}",
                    content=f"Summary: {prec['summary']}. Breach Code: {prec['breach_code']}",
                    entity_id=prec["case_id"],
                    tags=prec["tags"],
                    metadata={"case_id": prec["case_id"], "breach_code": prec["breach_code"]}
                )

        # Seed Initial Agent Dossiers in Warm Tier
        if counts.get(MemoryTier.WARM.value, 0) == 0:
            initial_agents = [
                CreditDossier(
                    agent_id="agent_alpha_data",
                    name="Alpha Data Scraper 9000",
                    credit_score=850,
                    rating=CreditRating.AAA,
                    total_deals=48,
                    successful_deals=48,
                    default_count=0,
                    dispute_loss_count=0,
                    total_volume_usdc=24000.0,
                    required_collateral_ratio=0.0,
                    max_credit_limit_usdc=25000.0,
                    risk_flags=[]
                ),
                CreditDossier(
                    agent_id="agent_beta_oracle",
                    name="Beta Price Streamer",
                    credit_score=720,
                    rating=CreditRating.A,
                    total_deals=32,
                    successful_deals=30,
                    default_count=0,
                    dispute_loss_count=1,
                    total_volume_usdc=15200.0,
                    required_collateral_ratio=0.2,
                    max_credit_limit_usdc=10000.0,
                    risk_flags=["LATENCY_SPIKE_WARNING"]
                ),
                CreditDossier(
                    agent_id="agent_rogue_miner",
                    name="Rogue Sub-LLM Miner",
                    credit_score=420,
                    rating=CreditRating.CCC,
                    total_deals=14,
                    successful_deals=8,
                    default_count=3,
                    dispute_loss_count=3,
                    total_volume_usdc=4500.0,
                    required_collateral_ratio=1.5,
                    max_credit_limit_usdc=500.0,
                    risk_flags=["REPEATED_SLA_BREACH", "STALE_DATA_RECIDIVIST", "UNCOLLATERALIZED_PROHIBITED"]
                )
            ]
            for agent in initial_agents:
                self.save_agent_dossier(agent)

    # 1. HOT TIER (Active Mandates & Cases)
    def put_hot_mandate(self, mandate: Mandate) -> None:
        self.store.insert_record(
            record_id=f"MANDATE-{mandate.mandate_id}",
            tier=MemoryTier.HOT.value,
            title=f"Active Mandate: {mandate.title}",
            content=f"Mandate {mandate.mandate_id} between {mandate.buyer_agent_id} and {mandate.worker_agent_id}. Amount: {mandate.amount_usdc} USDC. Status: {mandate.status.value}. SLA: {mandate.sla.category}",
            entity_id=mandate.mandate_id,
            tags=["mandate", mandate.status.value, mandate.buyer_agent_id, mandate.worker_agent_id],
            metadata=mandate.model_dump()
        )

    def get_hot_mandate(self, mandate_id: str) -> Optional[Mandate]:
        records = self.store.search(query=f"MANDATE-{mandate_id}", tier=MemoryTier.HOT.value, limit=1)
        if records and "metadata" in records[0]:
            try:
                return Mandate.model_validate(records[0]["metadata"])
            except Exception:
                return None
        return None

    # 2. WARM TIER (Agent Credit Dossiers & Entity Graph)
    def save_agent_dossier(self, dossier: CreditDossier) -> None:
        content_summary = (
            f"Agent: {dossier.name} ({dossier.agent_id}). Score: {dossier.credit_score} Rating: {dossier.rating.value}. "
            f"Deals: {dossier.successful_deals}/{dossier.total_deals}. Defaults: {dossier.default_count}. "
            f"Dispute Losses: {dossier.dispute_loss_count}. Collateral Ratio: {dossier.required_collateral_ratio * 100}%. "
            f"Flags: {', '.join(dossier.risk_flags) if dossier.risk_flags else 'None'}."
        )
        self.store.insert_record(
            record_id=f"DOSSIER-{dossier.agent_id}",
            tier=MemoryTier.WARM.value,
            title=f"Credit Dossier: {dossier.name} ({dossier.rating.value})",
            content=content_summary,
            entity_id=dossier.agent_id,
            tags=["dossier", dossier.agent_id, dossier.rating.value] + dossier.risk_flags,
            metadata=dossier.model_dump()
        )

    def get_agent_dossier(self, agent_id: str) -> Optional[CreditDossier]:
        records = self.store.search(query=f"DOSSIER-{agent_id}", tier=MemoryTier.WARM.value, limit=1)
        if records and "metadata" in records[0]:
            try:
                return CreditDossier.model_validate(records[0]["metadata"])
            except Exception:
                return None
        return None

    def list_agent_dossiers(self) -> List[CreditDossier]:
        records = self.store.get_records_by_tier(tier=MemoryTier.WARM.value, limit=100)
        dossiers = []
        for r in records:
            if "metadata" in r and r["metadata"]:
                try:
                    dossiers.append(CreditDossier.model_validate(r["metadata"]))
                except Exception:
                    pass
        return dossiers

    # 3. COLD TIER (Immutable Event & Transaction Journal)
    def log_cold_journal_event(
        self,
        event_type: str,
        tx_hash: str,
        description: str,
        entity_id: Optional[str] = None,
        payload: Optional[Dict[str, Any]] = None
    ) -> None:
        record_id = f"EVENT-{tx_hash[:12]}"
        self.store.insert_record(
            record_id=record_id,
            tier=MemoryTier.COLD.value,
            title=f"Onchain Event: {event_type}",
            content=f"Hash: {tx_hash}. Type: {event_type}. Detail: {description}",
            entity_id=entity_id or tx_hash,
            tags=["cold_journal", "onchain", event_type],
            metadata={"tx_hash": tx_hash, "event_type": event_type, "payload": payload or {}}
        )

    # 4. REFERENCE TIER (Statutes & Legal Code)
    def search_statutes(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        return self.store.search(query=query, tier=MemoryTier.REFERENCE.value, limit=limit)

    # 5. ARCHIVE TIER (Adjudicated Case Precedents)
    def archive_case_ruling(self, ruling: CaseRuling) -> None:
        summary = (
            f"Case {ruling.case_id} for Mandate {ruling.mandate_id}. Ruling: {ruling.ruling_type.value}. "
            f"Slash: {ruling.slash_percentage}%. Plaintiff Award: {ruling.plaintiff_award_usdc} USDC. "
            f"Rationale: {ruling.legal_rationale}. Statutes Cited: {', '.join(ruling.cited_statutes)}."
        )
        self.store.insert_record(
            record_id=f"CASE-{ruling.case_id}",
            tier=MemoryTier.ARCHIVE.value,
            title=f"Adjudicated Case Precedent: {ruling.case_id}",
            content=summary,
            entity_id=ruling.case_id,
            tags=["archive", "precedent", ruling.ruling_type.value, ruling.mandate_id],
            metadata=ruling.model_dump()
        )

    def search_precedents(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        return self.store.search(query=query, tier=MemoryTier.ARCHIVE.value, limit=limit)

    # GENERAL UTILITIES
    def search_all_tiers(self, query: str, limit: int = 20) -> List[Dict[str, Any]]:
        return self.store.search(query=query, limit=limit)

    def get_tier_counts(self) -> Dict[str, int]:
        return self.store.count_by_tier()

    def get_tier_records(self, tier: str, limit: int = 50) -> List[Dict[str, Any]]:
        return self.store.get_records_by_tier(tier=tier, limit=limit)

    def reset_to_clean_state(self) -> None:
        """Reset and re-seed clean state."""
        self.store.clear_all()
        self._seed_reference_and_initial_data()
