import React, { useState, useEffect } from 'react';
import { Zap, User, Calculator, Lock } from 'lucide-react';
import type { CreditDossier, CreditRating } from '../types';

interface UnderwritingDeskProps {
  dossiers: CreditDossier[];
  onAssessRisk: (agentId: string, amount: number) => Promise<any>;
}

export const UnderwritingDesk: React.FC<UnderwritingDeskProps> = ({ dossiers, onAssessRisk }) => {
  const [selectedAgent, setSelectedAgent] = useState<string>(dossiers[0]?.agent_id || 'agent_alpha_data');
  const [requestedAmount, setRequestedAmount] = useState<number>(5000);
  const [assessment, setAssessment] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    if (dossiers.length > 0 && !selectedAgent) {
      setSelectedAgent(dossiers[0].agent_id);
    }
  }, [dossiers]);

  const handleCalculateRisk = async () => {
    setIsCalculating(true);
    try {
      const res = await onAssessRisk(selectedAgent, requestedAmount);
      setAssessment(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsCalculating(false);
    }
  };

  useEffect(() => {
    if (selectedAgent) {
      handleCalculateRisk();
    }
  }, [selectedAgent]);

  const getRatingBadge = (rating: CreditRating) => {
    switch (rating) {
      case 'AAA':
      case 'AA':
        return <span className="tag tag-emerald">{rating} PRIME</span>;
      case 'A':
      case 'BBB':
        return <span className="tag tag-cyan">{rating} STANDARD</span>;
      case 'BB':
      case 'B':
        return <span className="tag tag-amber">{rating} SPECULATIVE</span>;
      case 'CCC':
      case 'D':
        return <span className="tag tag-rose">{rating} DEFAULT RISK</span>;
      default:
        return <span className="tag tag-neutral">{rating}</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Overview Banner */}
      <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <Zap size={18} color="var(--accent-indigo)" />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Autonomous Credit Underwriting Desk</h2>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Underwrite counterparty creditworthiness and enforce dynamic Base Escrow collateral lockup (Statute A2A-§405)
            </p>
          </div>
          <span className="tag tag-indigo">
            <Lock size={12} />
            Statute A2A-§405 Enforced
          </span>
        </div>
      </div>

      {/* Main Grid: Dossier Cards & Interactive Underwriting Calculator */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem' }}>
        {/* Left: Agent Dossiers in WARM Tier */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <User size={15} color="var(--accent-primary)" />
              Agent Credit Register (WARM Tier)
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{dossiers.length} Entities Tracked</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {dossiers.map((d) => {
              const isSelected = selectedAgent === d.agent_id;
              const scorePct = (d.credit_score / 1000) * 100;
              const scoreColor = d.credit_score > 700 ? 'var(--accent-emerald)' : d.credit_score > 500 ? 'var(--accent-amber)' : 'var(--accent-rose)';

              return (
                <div
                  key={d.agent_id}
                  onClick={() => setSelectedAgent(d.agent_id)}
                  className="panel-interactive"
                  style={{
                    cursor: 'pointer',
                    padding: '1rem 1.15rem',
                    borderRadius: 'var(--radius-md)',
                    background: isSelected ? 'var(--bg-surface-raised)' : 'var(--bg-surface)',
                    border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.65rem',
                    boxShadow: isSelected ? '0 0 16px rgba(56, 189, 248, 0.15)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <strong style={{ fontSize: '0.92rem', color: isSelected ? '#ffffff' : 'var(--text-main)' }}>{d.name}</strong>
                      <div className="font-mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {d.agent_id}
                      </div>
                    </div>
                    {getRatingBadge(d.rating)}
                  </div>

                  {/* Credit Score Progress Bar */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Credit Score</span>
                      <span className="font-mono" style={{ fontWeight: 700, color: scoreColor }}>
                        {d.credit_score} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>/ 1000</span>
                      </span>
                    </div>
                    <div className="progress-track">
                      <div
                        className="progress-bar"
                        style={{
                          width: `${scorePct}%`,
                          background: scoreColor
                        }}
                      />
                    </div>
                  </div>

                  {/* Metrics Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', background: 'var(--bg-surface-inset)', padding: '0.55rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Success Rate</div>
                      <div className="font-mono" style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                        {d.successful_deals}/{d.total_deals}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Defaults / Losses</div>
                      <div className="font-mono" style={{ fontSize: '0.85rem', fontWeight: 700, color: d.default_count > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>
                        {d.default_count} / {d.dispute_loss_count}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Total Volume</div>
                      <div className="font-mono" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        ${d.total_volume_usdc.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Risk Flags */}
                  {d.risk_flags && d.risk_flags.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                      {d.risk_flags.map((flag, idx) => (
                        <span key={idx} className="tag tag-rose" style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem' }}>
                          {flag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Dynamic Underwriting Calculator */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <Calculator size={18} color="var(--accent-primary)" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Collateral Requirement Underwriter</h3>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Computes mandatory on-chain collateral lockup before contract authorization
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                Counterparty Agent
              </label>
              <select
                className="input-control font-mono"
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
              >
                {dossiers.map((d) => (
                  <option key={d.agent_id} value={d.agent_id}>
                    {d.name} ({d.rating} — Score {d.credit_score})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                Requested Mandate Size (USDC)
              </label>
              <input
                type="number"
                className="input-control font-mono"
                value={requestedAmount}
                onChange={(e) => setRequestedAmount(Number(e.target.value))}
              />
              <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.4rem' }}>
                {[2500, 5000, 10000, 25000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setRequestedAmount(amt)}
                    className="btn btn-ghost"
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', fontFamily: 'var(--font-mono)' }}
                  >
                    ${amt >= 1000 ? `${amt / 1000}k` : amt}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleCalculateRisk}
              disabled={isCalculating}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem', marginTop: '0.25rem' }}
            >
              <Zap size={15} />
              {isCalculating ? 'Evaluating Risk Matrix...' : 'Evaluate Underwriting Terms'}
            </button>
          </div>

          {/* Assessment Output Display */}
          {assessment && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Underwriting Verdict:</span>
                <span className={`tag ${assessment.verdict === 'APPROVED_UNCOLLATERALIZED' ? 'tag-emerald' : assessment.verdict === 'REJECTED_DEFAULT_RISK' ? 'tag-rose' : 'tag-amber'}`}>
                  {assessment.verdict}
                </span>
              </div>

              {/* Collateral Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="metric-box">
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Mandatory Collateral Deposit</div>
                  <div className="font-mono" style={{ fontSize: '1.25rem', fontWeight: 800, color: assessment.required_collateral_usdc > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>
                    ${assessment.required_collateral_usdc.toLocaleString()} USDC
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    ({(assessment.required_collateral_ratio * 100).toFixed(0)}% Margin Requirement)
                  </div>
                </div>

                <div className="metric-box">
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Risk Spread Premium</div>
                  <div className="font-mono" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-amber)' }}>
                    {assessment.risk_premium_bps} bps
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    ({(assessment.risk_premium_bps / 100).toFixed(2)}% APY)
                  </div>
                </div>
              </div>

              {/* Rationale */}
              <div className="panel-inset" style={{ padding: '0.85rem' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                  Underwriter Statutory Rationale:
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-main)', lineHeight: '1.5' }}>
                  {assessment.rationale}
                </p>
              </div>

              {/* Memory Footprint Tag */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                <span>Memory Tiers Consulted:</span>
                {assessment.memory_consulted_tiers.map((t: string, idx: number) => (
                  <span key={idx} className="tag tag-cyan" style={{ fontSize: '0.65rem' }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
