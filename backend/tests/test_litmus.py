import unittest
from lex_agentica.simulator.litmus_test import LitmusBenchmarkRunner


class TestLitmus(unittest.TestCase):
    def test_cold_start_litmus_benchmark(self):
        runner = LitmusBenchmarkRunner()
        report = runner.run_benchmark()

        self.assertTrue(report.gate_passed)
        self.assertGreater(report.cold_start_recall_ms, 0.0)
        self.assertGreaterEqual(report.capital_loss_prevented_usdc, 10000.0)
        self.assertEqual(len(report.steps), 3)
        self.assertIn("A2A-§403", report.statutes_invoked)


if __name__ == "__main__":
    unittest.main()
