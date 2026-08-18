import unittest
from lex_agentica.memory.engine import SibylMemoryEngine
from lex_agentica.core.models import MemoryTier, Mandate, MandateStatus, SLA, CreditDossier, CreditRating


class TestMemory(unittest.TestCase):
    def test_sibyl_memory_initial_seeding(self):
        engine = SibylMemoryEngine(db_path=":memory:")
        counts = engine.get_tier_counts()
        
        self.assertGreaterEqual(counts[MemoryTier.REFERENCE.value], 5)
        self.assertGreaterEqual(counts[MemoryTier.ARCHIVE.value], 2)
        self.assertGreaterEqual(counts[MemoryTier.WARM.value], 3)

    def test_fts5_search_statutes(self):
        engine = SibylMemoryEngine(db_path=":memory:")
        results = engine.search_statutes("stale data oracle latency")
        
        self.assertGreater(len(results), 0)
        self.assertTrue(any("A2A-§401" in r["title"] or "A2A-§401" in r["entity_id"] for r in results))
        self.assertGreaterEqual(results[0]["search_ms"], 0)

    def test_warm_tier_dossier_operations(self):
        engine = SibylMemoryEngine(db_path=":memory:")
        dossier = engine.get_agent_dossier("agent_alpha_data")
        
        self.assertIsNotNone(dossier)
        self.assertEqual(dossier.rating, CreditRating.AAA)
        self.assertEqual(dossier.credit_score, 850)
        self.assertEqual(dossier.required_collateral_ratio, 0.0)

    def test_hot_mandate_storage(self):
        engine = SibylMemoryEngine(db_path=":memory:")
        mandate = Mandate(
            mandate_id="TEST-MANDATE-001",
            buyer_agent_id="buyer_01",
            worker_agent_id="worker_01",
            title="Test Data Task",
            amount_usdc=1000.0,
            sla=SLA(category="INFERENCE", max_latency_ms=1000),
            deadline_ts="2026-08-30T00:00:00Z"
        )
        engine.put_hot_mandate(mandate)
        
        retrieved = engine.get_hot_mandate("TEST-MANDATE-001")
        self.assertIsNotNone(retrieved)
        self.assertEqual(retrieved.title, "Test Data Task")
        self.assertEqual(retrieved.amount_usdc, 1000.0)


if __name__ == "__main__":
    unittest.main()
