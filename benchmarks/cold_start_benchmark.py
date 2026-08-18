"""Benchmark runner script for evaluating Sibyl 5-Tier Memory recall speed and load-bearing efficacy.
"""

import os
import sys
import time
from pathlib import Path

# Ensure UTF-8 output on Windows terminals
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Add backend to sys.path
backend_path = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from lex_agentica.simulator.litmus_test import LitmusBenchmarkRunner


def run():
    print("[*] Initializing Lex Agentica Cold-Start Benchmark...")
    runner = LitmusBenchmarkRunner()
    
    start_total = time.perf_counter()
    report = runner.run_benchmark()
    elapsed_total_ms = (time.perf_counter() - start_total) * 1000.0
    
    print("\n" + "=" * 70)
    print("  SIBYL 5-TIER MEMORY LOAD-BEARING BENCHMARK RESULTS")
    print("=" * 70)
    print(f"  * Status:                    {'PASSED (Gate 40% Verified)' if report.gate_passed else 'FAILED'}")
    print(f"  * Cold-Start Recall Latency: {report.cold_start_recall_ms:.3f} ms")
    print(f"  * Total Benchmark Runtime:   {elapsed_total_ms:.2f} ms")
    print(f"  * Capital Loss Prevented:    ${report.capital_loss_prevented_usdc:,.2f} USDC")
    print(f"  * Precedents Recalled:       {', '.join(report.precedents_recalled)}")
    print(f"  * Statutes Invoked:          {', '.join(report.statutes_invoked)}")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    run()
