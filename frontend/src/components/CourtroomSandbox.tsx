import React, { useState } from 'react';
import { Scale, Gavel, CheckCircle2, Lock, ExternalLink, FileText, AlertTriangle, ShieldAlert } from 'lucide-react';
import type { CaseRuling } from '../types';

interface CourtroomSandboxProps {
  onAdjudicate: (payload: {
    mandate_id: string;
    plaintiff_agent_id: string;
    defendant_agent_id: string;
    reason: string;
    alleged_breach_code: string;
    actual_latency_ms: number;
    actual_accuracy_pct: number;
    has_malicious_payload: boolean;
  }) => Promise<{ ruling: CaseRuling; onchain_receipt: any; updated_worker_dossier: any }>;
}

const BREACH_SCENARIOS = [
  {
    id: 'MALICIOUS',
    title: 'Malicious Payload Exploit',
    desc: 'Sub-LLM injected unauthorized memory probing bytecode',
    code: 'A2A-§403',
    tagClass: 'tag-rose',
    icon: ShieldAlert
  },
  {
    id: 'LATENCY',
    title: 'Stale Oracle / Delay',
    desc: 'Price feed delivered 14.2s late (exceeded 2.0s SLA)',
    code: 'A2A-§401',
    tagClass: 'tag-amber',
    icon: AlertTriangle
  },
  {
    id: 'PARTIAL',
    title: 'Substandard Delivery',
    desc: '80% completed; 20% pipelines corrupted',
    code: 'A2A-§402',
    tagClass: 'tag-cyan',
    icon: FileText
  },
  {
    id: 'FRIVOLOUS',
    title: 'Frivolous Dispute',
    desc: 'Buyer filed false claim despite 100% verified SLA',
    code: 'A2A-§404',
    tagClass: 'tag-emerald',
    icon: CheckCircle2
  }
];

export const CourtroomSandbox: React.FC<CourtroomSandboxProps> = ({ onAdjudicate }) => {
  const [selectedBuyer, setSelectedBuyer] = useState('agent_client_apex');
  const [selectedWorker, setSelectedWorker] = useState('agent_rogue_miner');
  const [amountUsdc, setAmountUsdc] = useState(2500);
  const [slaCategory, setSlaCategory] = useState('DATA_ORACLE');
  const [breachScenario, setBreachScenario] = useState<string>('MALICIOUS');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [latestRuling, setLatestRuling] = useState<CaseRuling | null>(null);
  const [onchainReceipt, setOnchainReceipt] = useState<any>(null);

  const handleSimulateDispute = async () => {
    setIsSubmitting(true);
    try {
      let reason = '';
      let breachCode = 'A2A-§401';
      let latency = 2000;
      let accuracy = 98.0;
      let isMalicious = false;

      if (breachScenario === 'MALICIOUS') {
        breachCode = 'A2A-§403';
        reason = 'Worker payload contained prompt injection and unauthorized memory probing exploit';
        isMalicious = true;
        latency = 4500;
      } else if (breachScenario === 'LATENCY') {
        breachCode = 'A2A-§401';
        reason = 'Oracle data feed was stale by 14,200ms against agreed 2,000ms SLA';
        latency = 14200;
      } else if (breachScenario === 'PARTIAL') {
        breachCode = 'A2A-§402';
        reason = 'Worker completed 80% of data parsing pipelines; 20% corrupted';
        accuracy = 80.0;
      } else {
        breachCode = 'A2A-§404';
        reason = 'Buyer filed frivolous claim despite worker meeting 100% cryptographic SLA';
        accuracy = 100.0;
        latency = 1200;
      }

      const res = await onAdjudicate({
        mandate_id: `MANDATE-${Date.now()}`,
        plaintiff_agent_id: selectedBuyer,
        defendant_agent_id: selectedWorker,
        reason,
        alleged_breach_code: breachCode,
        actual_latency_ms: latency,
        actual_accuracy_pct: accuracy,
        has_malicious_payload: isMalicious
      });

      setLatestRuling(res.ruling);
      setOnchainReceipt(res.onchain_receipt);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '1.5rem' }}>
      {/* Left Column: Dispute Filing & Contract Parameters */}
      <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <Scale size={18} color="var(--accent-primary)" />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>A2A Dispute Filing Terminal</h2>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Configure commercial mandate parameters and trigger autonomous precedent-guided arbitration
          </p>
        </div>

        {/* Counterparty selectors */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
              Plaintiff (Hiring Agent)
            </label>
            <select
              className="input-control font-mono"
              value={selectedBuyer}
              onChange={(e) => setSelectedBuyer(e.target.value)}
            >
              <option value="agent_client_apex">agent_client_apex (Apex Treasury Fund)</option>
              <option value="agent_alpha_data">agent_alpha_data (Alpha Data Scraper)</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
              Defendant (Worker Counterparty)
            </label>
            <select
              className="input-control font-mono"
              value={selectedWorker}
              onChange={(e) => setSelectedWorker(e.target.value)}
            >
              <option value="agent_rogue_miner">agent_rogue_miner (Rogue Sub-LLM Miner — Rating CCC)</option>
              <option value="agent_beta_oracle">agent_beta_oracle (Beta Price Streamer — Rating A)</option>
              <option value="agent_alpha_data">agent_alpha_data (Alpha Data Scraper — Rating AAA)</option>
            </select>
          </div>

          {/* Amount & Category */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                Escrow Value (USDC)
              </label>
              <input
                type="number"
                className="input-control font-mono"
                value={amountUsdc}
                onChange={(e) => setAmountUsdc(Number(e.target.value))}
              />
              <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.35rem' }}>
                {[1000, 2500, 5000, 10000].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setAmountUsdc(v)}
                    className="btn btn-ghost"
                    style={{ padding: '0.15rem 0.4rem', fontSize: '0.68rem', fontFamily: 'var(--font-mono)' }}
                  >
                    ${v >= 1000 ? `${v / 1000}k` : v}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                SLA Category
              </label>
              <select
                className="input-control"
                value={slaCategory}
                onChange={(e) => setSlaCategory(e.target.value)}
              >
                <option value="DATA_ORACLE">DATA_ORACLE</option>
                <option value="INFERENCE_WORK">INFERENCE_WORK</option>
                <option value="SECURITY">SECURITY</option>
              </select>
            </div>
          </div>
        </div>

        {/* Breach Scenario Cards */}
        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
            Select Statutory Breach Ground:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
            {BREACH_SCENARIOS.map((item) => {
              const IconComponent = item.icon;
              const isSelected = breachScenario === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setBreachScenario(item.id)}
                  className="panel-interactive"
                  style={{
                    cursor: 'pointer',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    background: isSelected ? 'var(--bg-surface-raised)' : 'var(--bg-surface-inset)',
                    border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem',
                    boxShadow: isSelected ? '0 0 12px rgba(56, 189, 248, 0.15)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <IconComponent size={14} color={isSelected ? 'var(--accent-primary)' : 'var(--text-muted)'} />
                      <strong style={{ fontSize: '0.82rem', color: isSelected ? '#ffffff' : 'var(--text-main)' }}>{item.title}</strong>
                    </div>
                    <span className={`tag ${item.tagClass}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem' }}>{item.code}</span>
                  </div>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: '1.35' }}>
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Adjudicate Trigger Button */}
        <button
          onClick={handleSimulateDispute}
          disabled={isSubmitting}
          className="btn btn-primary"
          style={{ width: '100%', padding: '0.75rem', fontSize: '0.88rem' }}
        >
          <Gavel size={16} />
          {isSubmitting ? 'Consulting Reference Statutes & Precedents...' : 'Adjudicate with Sibyl 5-Tier Memory'}
        </button>
      </div>

      {/* Right Column: Case Law Adjudication Output */}
      <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <Gavel size={18} color="var(--accent-emerald)" />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Autonomous Judicial Ruling</h2>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Inkracht legal adjudication with Base Sepolia cryptographic execution
            </p>
          </div>
          {latestRuling && (
            <span className="tag tag-emerald">
              <CheckCircle2 size={12} />
              SETTLED ONCHAIN
            </span>
          )}
        </div>

        {!latestRuling ? (
          <div style={{ padding: '4rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--bg-surface-raised)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-subtle)' }}>
              <Scale size={28} color="var(--text-muted)" />
            </div>
            <strong style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>No active case ruling loaded</strong>
            <p style={{ fontSize: '0.8rem', maxWidth: '320px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              Select a breach ground on the left and click <strong>"Adjudicate"</strong> to trigger autonomous precedent recall from the Sibyl ARCHIVE.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            {/* Verdict Header Card */}
            <div className="panel-inset" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className={`tag ${latestRuling.slash_percentage === 100 ? 'tag-rose' : latestRuling.slash_percentage === 0 ? 'tag-emerald' : 'tag-amber'}`} style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}>
                  {latestRuling.ruling_type}
                </span>
                <span className="font-mono" style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  Docket #{latestRuling.case_id}
                </span>
              </div>

              {/* Fund Allocation Metric Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="metric-box">
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Plaintiff Refund</span>
                  <div className="font-mono" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                    ${latestRuling.plaintiff_award_usdc.toLocaleString()} USDC
                  </div>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    {latestRuling.slash_percentage}% of disputed funds
                  </span>
                </div>

                <div className="metric-box">
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Defendant Payout</span>
                  <div className="font-mono" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                    ${latestRuling.defendant_award_usdc.toLocaleString()} USDC
                  </div>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    {100 - latestRuling.slash_percentage}% performance release
                  </span>
                </div>
              </div>

              {/* Visual Split Progress Bar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '0.2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  <span>Plaintiff Share: {latestRuling.slash_percentage}%</span>
                  <span>Defendant Share: {100 - latestRuling.slash_percentage}%</span>
                </div>
                <div className="progress-track" style={{ height: '8px' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${latestRuling.slash_percentage}%`,
                      background: 'linear-gradient(90deg, #10b981 0%, #06b6d4 100%)',
                      borderRadius: '999px'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Legal Rationale */}
            <div className="panel-inset" style={{ padding: '0.9rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                Findings of Fact & Legal Rationale:
              </span>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-main)', lineHeight: '1.6' }}>
                {latestRuling.legal_rationale}
              </p>
            </div>

            {/* Cited References */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="panel-inset" style={{ padding: '0.75rem' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                  Statutes (REFERENCE Tier):
                </span>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  {latestRuling.cited_statutes.map((s, idx) => (
                    <span key={idx} className="tag tag-emerald">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="panel-inset" style={{ padding: '0.75rem' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                  Precedents (ARCHIVE Tier):
                </span>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  {latestRuling.cited_precedents.length > 0 ? (
                    latestRuling.cited_precedents.map((p, idx) => (
                      <span key={idx} className="tag tag-amber">
                        {p}
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>First Impression — No Prior Precedent</span>
                  )}
                </div>
              </div>
            </div>

            {/* Onchain Settlement Receipt */}
            {onchainReceipt && (
              <div className="panel-raised" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                  <Lock size={14} />
                  Base Sepolia Slashed & Settled
                </span>
                <a
                  href={onchainReceipt.explorer_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'var(--accent-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem', fontFamily: 'var(--font-mono)' }}
                >
                  <span>{onchainReceipt.tx_hash.slice(0, 14)}...</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
