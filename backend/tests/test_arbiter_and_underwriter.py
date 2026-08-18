import unittest
from lex_agentica.memory.engine import SibylMemoryEngine
from lex_agentica.core.arbiter import AutonomousArbiter
from lex_agentica.core.underwriter import AutonomousUnderwriter
from lex_agentica.core.models import (
    Mandate,
    MandateStatus,
    SLA,
    DisputeClaim,
    RulingType,
    CreditRating
)


class TestArbiterAndUnderwriter(unittest.TestCase):
    def test_arbiter_malicious_payload_slashing(self):
        engine = SibylMemoryEngine(db_path=":memory:")
        arbiter = AutonomousArbiter(engine)

        mandate = Mandate(
            mandate_id="M-TEST-002",
            buyer_agent_id="agent_alpha_data",
            worker_agent_id="agent_rogue_miner",
            title="Exploit Test Mandate",
            amount_usdc=3000.0,
            sla=SLA(category="SECURITY", max_latency_ms=2000),
            deadline_ts="2026-08-30T00:00:00Z"
        )
        engine.put_hot_mandate(mandate)

        claim = DisputeClaim(
            claim_id="C-TEST-002",
            mandate_id=mandate.mandate_id,
            plaintiff_agent_id="agent_alpha_data",
            defendant_agent_id="agent_rogue_miner",
            reason="Malicious bytecode exploit detected in worker response",
            alleged_breach_code="A2A-§403",
            evidence_payload={"has_malicious_payload": True}
        )

        ruling = arbiter.adjudicate_dispute(mandate, claim)

        self.assertEqual(ruling.ruling_type, RulingType.PLAINTIFF_FULL_REFUND)
        self.assertEqual(ruling.slash_percentage, 100.0)
        self.assertEqual(ruling.plaintiff_award_usdc, 3000.0)
        self.assertEqual(ruling.defendant_award_usdc, 0.0)
        self.assertIn("A2A-§403", ruling.cited_statutes)
        
        # Check that rogue miner's credit score was degraded
        dossier = engine.get_agent_dossier("agent_rogue_miner")
        self.assertIsNotNone(dossier)
        self.assertIn(dossier.rating, [CreditRating.CCC, CreditRating.D])
        self.assertGreater(dossier.dispute_loss_count, 0)

    def test_underwriter_risk_assessment(self):
        engine = SibylMemoryEngine(db_path=":memory:")
        underwriter = AutonomousUnderwriter(engine)

        # AAA Agent Assessment
        assessment_aaa = underwriter.assess_counterparty_risk(
            agent_id="agent_alpha_data",
            requested_mandate_amount_usdc=5000.0
        )
        self.assertEqual(assessment_aaa.credit_rating, CreditRating.AAA)
        self.assertEqual(assessment_aaa.required_collateral_ratio, 0.0)
        self.assertEqual(assessment_aaa.required_collateral_usdc, 0.0)
        self.assertEqual(assessment_aaa.verdict, "APPROVED_UNCOLLATERALIZED")

        # CCC/D Recidivist Agent Assessment
        assessment_rogue = underwriter.assess_counterparty_risk(
            agent_id="agent_rogue_miner",
            requested_mandate_amount_usdc=5000.0
        )
        self.assertGreaterEqual(assessment_rogue.required_collateral_ratio, 1.5)
        self.assertGreaterEqual(assessment_rogue.required_collateral_usdc, 7500.0)


if __name__ == "__main__":
    unittest.main()
