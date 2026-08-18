"""Command Line Interface for Lex Agentica.
Provides interactive demo, benchmark runner, and memory inspector for terminal testing.
"""

import argparse
import json
import sys

# Ensure UTF-8 output on Windows terminals
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

from lex_agentica.memory.engine import SibylMemoryEngine
from lex_agentica.core.underwriter import AutonomousUnderwriter
from lex_agentica.simulator.litmus_test import LitmusBenchmarkRunner


def main():
    parser = argparse.ArgumentParser(
        description="Lex Agentica CLI - Persistent Trust, Underwriting & Autonomous Legal Layer"
    )
    subparsers = parser.add_subparsers(dest="command")

    # Command: benchmark (Cold Start Litmus Test)
    subparsers.add_parser("benchmark", help="Run Cold-Start & Memory Deletion Litmus Test")

    # Command: memory-stats
    subparsers.add_parser("memory-stats", help="Inspect Sibyl 5-Tier Memory record counts")

    # Command: search
    search_parser = subparsers.add_parser("search", help="Search Sibyl Memory via SQLite FTS5")
    search_parser.add_argument("query", type=str, help="Search query")
    search_parser.add_argument("--tier", type=str, default=None, help="Optional tier filter (HOT, WARM, COLD, REFERENCE, ARCHIVE)")

    # Command: underwrite
    underwrite_parser = subparsers.add_parser("underwrite", help="Assess counterparty credit risk")
    underwrite_parser.add_argument("agent_id", type=str, help="Agent identifier")
    underwrite_parser.add_argument("--amount", type=float, default=5000.0, help="Mandate amount USDC")

    args = parser.parse_args()

    if args.command == "benchmark":
        print("\n" + "=" * 80)
        print(" [LEX AGENTICA] SIBYL 5-TIER MEMORY LOAD-BEARING LITMUS TEST")
        print("=" * 80)
        runner = LitmusBenchmarkRunner()
        report = runner.run_benchmark()
        
        print(f"\n[+] Test ID: {report.test_id}")
        print(f"[+] Scenario: {report.scenario_title}")
        print(f"[+] Gate Passed (40% Weight): {'YES (100% LOAD-BEARING)' if report.gate_passed else 'NO'}")
        print(f"[+] Cold-Start Recall Latency: {report.cold_start_recall_ms} ms (Zero Embeddings FTS5)")
        print(f"[+] Capital Loss Prevented: ${report.capital_loss_prevented_usdc:,.2f} USDC\n")
        
        print("-" * 80)
        for step in report.steps:
            print(f"\n>> {step.step_name.upper()}")
            print(f"   Context:     {step.description}")
            print(f"   Memory ON:   {step.memory_on_action}")
            print(f"   Memory OFF:  {step.memory_off_action}")
            print(f"   Divergence:  {step.divergence_explained}")
        
        print("\n" + "=" * 80)
        print(" SUMMARY VERDICT")
        print("=" * 80)
        print(f" * MEMORY ENABLED:  {report.memory_on_outcome}")
        print(f" * MEMORY DELETED:  {report.memory_off_failure_mode}")
        print("=" * 80 + "\n")

    elif args.command == "memory-stats":
        mem = SibylMemoryEngine()
        counts = mem.get_tier_counts()
        print("\n[Sibyl 5-Tier Memory Status]")
        print(json.dumps(counts, indent=2))

    elif args.command == "search":
        mem = SibylMemoryEngine()
        results = mem.store.search(query=args.query, tier=args.tier)
        print(f"\nFound {len(results)} records for query '{args.query}':\n")
        for r in results:
            print(f"[{r['tier']}] {r['title']} (Score: {r['score']})")
            print(f"  {r['content'][:120]}...\n")

    elif args.command == "underwrite":
        mem = SibylMemoryEngine()
        uw = AutonomousUnderwriter(mem)
        assessment = uw.assess_counterparty_risk(agent_id=args.agent_id, requested_mandate_amount_usdc=args.amount)
        print(f"\n[Underwriting Assessment for {assessment.agent_id}]")
        print(json.dumps(assessment.model_dump(), indent=2))

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
