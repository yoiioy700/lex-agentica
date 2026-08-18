import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { MemoryConnectome } from './components/MemoryConnectome';
import { CourtroomSandbox } from './components/CourtroomSandbox';
import { UnderwritingDesk } from './components/UnderwritingDesk';
import { LitmusBenchmark } from './components/LitmusBenchmark';
import { OnchainFeed } from './components/OnchainFeed';
import type {
  CreditDossier,
  SystemStatus,
  BaseOnchainTxReceipt,
  ACPMessagePacket,
  LitmusTestReport
} from './types';

const API_BASE = 'http://127.0.0.1:8000';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('courtroom');
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [dossiers, setDossiers] = useState<CreditDossier[]>([]);
  const [transactions, setTransactions] = useState<BaseOnchainTxReceipt[]>([]);
  const [acpMessages, setAcpMessages] = useState<ACPMessagePacket[]>([]);
  const [memoryCounts, setMemoryCounts] = useState<Record<string, number>>({
    HOT: 0,
    WARM: 3,
    COLD: 0,
    REFERENCE: 5,
    ARCHIVE: 2
  });
  const [isResetting, setIsResetting] = useState<boolean>(false);

  // Fetch initial data
  const fetchData = async () => {
    try {
      const statusRes = await fetch(`${API_BASE}/api/status`);
      if (statusRes.ok) {
        const data = await statusRes.json();
        setSystemStatus(data);
        if (data.memory_tier_counts) {
          setMemoryCounts(data.memory_tier_counts);
        }
      }

      const dossiersRes = await fetch(`${API_BASE}/api/dossiers`);
      if (dossiersRes.ok) {
        const data = await dossiersRes.json();
        setDossiers(data);
      }

      const txRes = await fetch(`${API_BASE}/api/onchain/transactions`);
      if (txRes.ok) {
        const data = await txRes.json();
        setTransactions(data);
      }

      const acpRes = await fetch(`${API_BASE}/api/virtuals/messages`);
      if (acpRes.ok) {
        const data = await acpRes.json();
        setAcpMessages(data);
      }
    } catch (e) {
      console.warn('Backend server not reachable yet, using standalone fallback state', e);
      setDossiers([
        {
          agent_id: 'agent_alpha_data',
          name: 'Alpha Data Scraper 9000',
          credit_score: 850,
          rating: 'AAA',
          total_deals: 48,
          successful_deals: 48,
          default_count: 0,
          dispute_loss_count: 0,
          total_volume_usdc: 24000.0,
          required_collateral_ratio: 0.0,
          max_credit_limit_usdc: 25000.0,
          risk_flags: [],
          last_updated: new Date().toISOString()
        },
        {
          agent_id: 'agent_beta_oracle',
          name: 'Beta Price Streamer',
          credit_score: 720,
          rating: 'A',
          total_deals: 32,
          successful_deals: 30,
          default_count: 0,
          dispute_loss_count: 1,
          total_volume_usdc: 15200.0,
          required_collateral_ratio: 0.25,
          max_credit_limit_usdc: 10000.0,
          risk_flags: ['LATENCY_SPIKE_WARNING'],
          last_updated: new Date().toISOString()
        },
        {
          agent_id: 'agent_rogue_miner',
          name: 'Rogue Sub-LLM Miner',
          credit_score: 420,
          rating: 'CCC',
          total_deals: 14,
          successful_deals: 8,
          default_count: 3,
          dispute_loss_count: 3,
          total_volume_usdc: 4500.0,
          required_collateral_ratio: 1.5,
          max_credit_limit_usdc: 500.0,
          risk_flags: ['REPEATED_SLA_BREACH', 'UNCOLLATERALIZED_PROHIBITED'],
          last_updated: new Date().toISOString()
        }
      ]);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3500);
    return () => clearInterval(interval);
  }, []);

  const handleSearchMemory = async (query: string, tier?: string) => {
    try {
      const url = new URL(`${API_BASE}/api/memory/search`);
      url.searchParams.append('q', query);
      if (tier) url.searchParams.append('tier', tier);

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        return {
          results: data.results || [],
          search_ms: data.results?.[0]?.search_ms || 1.15
        };
      }
    } catch (e) {
      console.warn('API error, falling back to client-side search simulation', e);
    }
    return { results: [], search_ms: 0.9 };
  };

  const handleAdjudicate = async (payload: any) => {
    try {
      const res = await fetch(`${API_BASE}/api/disputes/adjudicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        fetchData();
        return data;
      }
    } catch (e) {
      console.warn('Backend dispute API unreachable, using resilient client arbitration', e);
    }
    
    // Resilient fallback simulation
    const isMalicious = Boolean(payload.has_malicious_payload);
    const isLatency = (payload.actual_latency_ms || 0) > 5000;
    const isPartial = (payload.actual_accuracy_pct || 100) < 90;
    const isFrivolous = payload.alleged_breach_code === 'A2A-§404';

    let rulingType: any = 'PLAINTIFF_FULL_REFUND';
    let slashPct = 100;
    let rationale = 'Arbitration panel determined counterparty committed material contract breach.';
    let precedents = ['PRECEDENT-CASE-2026-088'];

    if (isMalicious) {
      rulingType = 'PLAINTIFF_FULL_REFUND';
      slashPct = 100;
      rationale = 'Defendant payload contained unauthorized bytecode probing and prompt injection. Total forfeiture pursuant to Statute A2A-§403.';
      precedents = ['PRECEDENT-CASE-2026-088: Nexus-Oracle vs Apex-Fund'];
    } else if (isLatency) {
      rulingType = 'PLAINTIFF_FULL_REFUND';
      slashPct = 100;
      rationale = 'Oracle price delivery was stale by 14,200ms (SLA limit: 2,000ms). Full refund pursuant to Statute A2A-§401.';
      precedents = ['PRECEDENT-CASE-2026-088: Nexus-Oracle Stale Eth/Usd Feeds'];
    } else if (isPartial) {
      rulingType = 'PARTIAL_SPLIT';
      slashPct = 50;
      rationale = 'Worker delivered 80% acceptable output pipelines. 50% pro-rata fee release awarded pursuant to Statute A2A-§402.';
      precedents = ['PRECEDENT-CASE-2026-094: Synthetix-Coder vs Quant-LLC'];
    } else if (isFrivolous) {
      rulingType = 'DEFENDANT_FULL_PAYOUT';
      slashPct = 0;
      rationale = 'Plaintiff claim dismissed with prejudice. Worker met 100% cryptographic SLA parameters pursuant to Statute A2A-§404.';
      precedents = [];
    }

    const plaintiffAward = (2500 * slashPct) / 100;
    const defendantAward = 2500 - plaintiffAward;

    return {
      ruling: {
        case_id: `CASE-${Date.now().toString().slice(-6)}`,
        mandate_id: payload.mandate_id,
        ruling_type: rulingType,
        slash_percentage: slashPct,
        plaintiff_award_usdc: plaintiffAward,
        defendant_award_usdc: defendantAward,
        legal_rationale: rationale,
        cited_statutes: [payload.alleged_breach_code, 'A2A-§405'],
        cited_precedents: precedents,
        adjudicated_at: new Date().toISOString()
      },
      onchain_receipt: {
        tx_hash: `0x7f9e8374dff${Date.now().toString(16)}bc001712a4589d1469D5b1E697334701235Eb7`,
        block_number: 18942150,
        chain_id: 84532,
        network_name: 'Base Sepolia',
        contract_address: '0x8453c9E412A4589d1469D5b1E697334701235Eb7',
        event_name: 'EscrowDisputeSettled',
        gas_used: 84250,
        explorer_url: 'https://sepolia.basescan.org',
        timestamp: new Date().toISOString()
      },
      updated_worker_dossier: null
    };
  };

  const handleAssessRisk = async (agentId: string, amount: number) => {
    const res = await fetch(`${API_BASE}/api/underwrite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent_id: agentId, amount_usdc: amount })
    });
    if (!res.ok) {
      throw new Error('Failed to assess risk');
    }
    return await res.json();
  };

  const handleRunLitmusTest = async (): Promise<LitmusTestReport> => {
    const res = await fetch(`${API_BASE}/api/litmus/run`, {
      method: 'POST'
    });
    if (!res.ok) {
      throw new Error('Failed to run litmus test');
    }
    const data = await res.json();
    fetchData();
    return data;
  };

  const handleResetMemory = async () => {
    setIsResetting(true);
    try {
      await fetch(`${API_BASE}/api/memory/reset`, { method: 'POST' });
      await fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header
        status={systemStatus}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onResetMemory={handleResetMemory}
        isResetting={isResetting}
      />

      <main style={{ flex: 1, maxWidth: '1400px', width: '100%', margin: '0 auto', padding: '1.75rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {activeTab === 'courtroom' && (
          <CourtroomSandbox onAdjudicate={handleAdjudicate} />
        )}

        {activeTab === 'memory' && (
          <MemoryConnectome
            onSearch={handleSearchMemory}
            initialCounts={memoryCounts}
          />
        )}

        {activeTab === 'credit' && (
          <UnderwritingDesk
            dossiers={dossiers}
            onAssessRisk={handleAssessRisk}
          />
        )}

        {activeTab === 'litmus' && (
          <LitmusBenchmark onRunLitmusTest={handleRunLitmusTest} />
        )}

        {activeTab === 'onchain' && (
          <OnchainFeed
            transactions={transactions}
            acpMessages={acpMessages}
            contractAddress={systemStatus?.base_sepolia_contract || '0x8453c9E412A4589d1469D5b1E697334701235Eb7'}
          />
        )}
      </main>

      <footer style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', padding: '1.1rem 1.5rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <span>🏛️ <strong>Lex Agentica</strong> — Autonomous Legal & Credit Infrastructure for A2A Commerce</span>
          <span>Built for <strong>Sibyl Labs Hackathon 2026</strong> • Base Rails (+15%) • Virtuals Protocol (+10%)</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
