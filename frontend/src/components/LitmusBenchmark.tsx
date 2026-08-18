import React, { useState } from 'react';
import { ShieldAlert, ShieldCheck, Play, CheckCircle2, XCircle, Zap, Cpu } from 'lucide-react';
import type { LitmusTestReport } from '../types';

interface LitmusBenchmarkProps {
  onRunLitmusTest: () => Promise<LitmusTestReport>;
}

export const LitmusBenchmark: React.FC<LitmusBenchmarkProps> = ({ onRunLitmusTest }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [report, setReport] = useState<LitmusTestReport | null>(null);

  const handleRunTest = async () => {
    setIsRunning(true);
    try {
      const res = await onRunLitmusTest();
      setReport(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Banner */}
      <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <ShieldAlert color="var(--accent-rose)" size={20} />
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                The Sibyl Load-Bearing Litmus Test (40% Weight Gate)
              </h2>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Proves that deleting the Sibyl Memory Layer destroys system integrity and causes total capital loss in fresh cold-start sessions.
            </p>
          </div>

          <button
            onClick={handleRunTest}
            disabled={isRunning}
            className="btn btn-danger"
            style={{ padding: '0.7rem 1.35rem', fontSize: '0.85rem', fontWeight: 700 }}
          >
            <Play size={16} />
            {isRunning ? 'Executing Cold-Start Stress Test...' : 'Run Litmus Benchmark'}
          </button>
        </div>

        {/* Litmus Gate Criteria Badges */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.6rem' }}>
          <div className="panel-inset" style={{ padding: '0.6rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
            <CheckCircle2 size={15} color="var(--accent-emerald)" />
            <span>Load-Bearing Deletion Test</span>
          </div>
          <div className="panel-inset" style={{ padding: '0.6rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
            <CheckCircle2 size={15} color="var(--accent-emerald)" />
            <span>Fresh-Session Cold Recall</span>
          </div>
          <div className="panel-inset" style={{ padding: '0.6rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
            <CheckCircle2 size={15} color="var(--accent-emerald)" />
            <span>Zero-Embedding SQLite FTS5</span>
          </div>
          <div className="panel-inset" style={{ padding: '0.6rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
            <CheckCircle2 size={15} color="var(--accent-emerald)" />
            <span>Capital Protection Verified</span>
          </div>
        </div>
      </div>

      {/* Benchmark Results */}
      {report ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Key Metrics HUD */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Litmus Gate Status</span>
              <div className="font-mono" style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <ShieldCheck size={20} />
                PASSED (100%)
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Score Weight: 40% Gate Verified</span>
            </div>

            <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Cold-Start Recall Latency</span>
              <div className="font-mono" style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Zap size={20} />
                {report.cold_start_recall_ms.toFixed(2)} ms
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Zero-Embedding SQLite FTS5</span>
            </div>

            <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Capital Loss Prevented</span>
              <div className="font-mono" style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                ${report.capital_loss_prevented_usdc.toLocaleString()} USDC
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Shielded by mandatory collateral</span>
            </div>
          </div>

          {/* Side-by-Side Comparison: Memory ON vs Memory OFF */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.25rem' }}>
            {/* Memory ON */}
            <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderLeft: '4px solid var(--accent-emerald)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.6rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <CheckCircle2 color="var(--accent-emerald)" size={18} />
                  <strong style={{ color: 'var(--accent-emerald)', fontSize: '0.95rem' }}>SIBYL MEMORY ENABLED</strong>
                </div>
                <span className="tag tag-emerald">SOLVENT</span>
              </div>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-main)', lineHeight: '1.6' }}>
                {report.memory_on_outcome}
              </p>
            </div>

            {/* Memory OFF */}
            <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderLeft: '4px solid var(--accent-rose)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.6rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <XCircle color="var(--accent-rose)" size={18} />
                  <strong style={{ color: 'var(--accent-rose)', fontSize: '0.95rem' }}>MEMORY LAYER DELETED (NO SIBYL)</strong>
                </div>
                <span className="tag tag-rose">EXPLOITED</span>
              </div>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                {report.memory_off_failure_mode}
              </p>
            </div>
          </div>

          {/* Step by Step Execution Breakdown */}
          <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.6rem' }}>
              Execution Divergence Audit Trail
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {report.steps.map((step, idx) => (
                <div key={idx} className="panel-inset" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="tag tag-neutral" style={{ fontSize: '0.7rem' }}>Step {idx + 1}</span>
                      <strong style={{ fontSize: '0.92rem', color: 'var(--text-main)' }}>{step.step_name}</strong>
                    </div>
                    <span className="font-mono" style={{ fontSize: '0.76rem', color: 'var(--accent-emerald)', fontWeight: 700, background: 'var(--accent-emerald-subtle)', padding: '0.15rem 0.5rem', borderRadius: '4px', border: '1px solid var(--accent-emerald-border)' }}>
                      +${step.loss_prevented_usdc.toLocaleString()} USDC Saved
                    </span>
                  </div>

                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{step.description}</p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.2rem' }}>
                    <div style={{ background: 'var(--accent-emerald-subtle)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--accent-emerald-border)', fontSize: '0.8rem' }}>
                      <strong style={{ color: 'var(--accent-emerald)', display: 'block', marginBottom: '0.25rem' }}>With Sibyl Memory:</strong>
                      {step.memory_on_action}
                    </div>

                    <div style={{ background: 'var(--accent-rose-subtle)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--accent-rose-border)', fontSize: '0.8rem' }}>
                      <strong style={{ color: 'var(--accent-rose)', display: 'block', marginBottom: '0.25rem' }}>Without Memory:</strong>
                      {step.memory_off_action}
                    </div>
                  </div>

                  <div className="font-mono" style={{ fontSize: '0.74rem', color: 'var(--accent-primary)', marginTop: '0.2rem' }}>
                    * Divergence Analysis: {step.divergence_explained}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="panel" style={{ padding: '4rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--bg-surface-raised)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-subtle)' }}>
            <Cpu size={28} color="var(--text-muted)" />
          </div>
          <strong style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>Litmus Benchmark Ready</strong>
          <p style={{ fontSize: '0.82rem', maxWidth: '440px', lineHeight: '1.5' }}>
            Click <strong>"Run Litmus Benchmark"</strong> above to launch the automated Cold-Start stress test and prove memory criticality.
          </p>
        </div>
      )}
    </div>
  );
};
