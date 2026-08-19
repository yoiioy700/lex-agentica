import { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { MemoryConnectome } from './components/MemoryConnectome';
import { CourtroomSandbox } from './components/CourtroomSandbox';
import { UnderwritingDesk } from './components/UnderwritingDesk';
import { LitmusBenchmark } from './components/LitmusBenchmark';
import { OnchainFeed } from './components/OnchainFeed';
import { ShieldAlert, Zap } from 'lucide-react';
import type {
  CreditDossier,
  SystemStatus,
  BaseOnchainTxReceipt,
  ACPMessagePacket,
  LitmusTestReport
} from './types';

const API_BASE = 'http://127.0.0.1:8000';
const WS_BASE = 'ws://127.0.0.1:8000';

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
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [latestLiveEvent, setLatestLiveEvent] = useState<{
    event_type: string;
    description: string;
    timestamp: string;
  } | null>(null);

  const wsRef = useRef<WebSocket | null>(null);

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
        if (typeof data.simulation_running === 'boolean') {
          setIsSimulating(data.simulation_running);
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
    }
  };

  // WebSocket Live Stream Connection
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connectWebSocket = () => {
      try {
        ws = new WebSocket(`${WS_BASE}/ws/live`);
        wsRef.current = ws;

        ws.onopen = () => {
          setWsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.description) {
              setLatestLiveEvent({
                event_type: data.event_type || 'EVENT',
                description: data.description,
                timestamp: data.timestamp || new Date().toISOString()
              });
            }
            fetchData();
          } catch (err) {
            console.error('Error parsing live event packet:', err);
          }
        };

        ws.onclose = () => {
          setWsConnected(false);
          reconnectTimeout = setTimeout(connectWebSocket, 3000);
        };

        ws.onerror = () => {
          setWsConnected(false);
          ws?.close();
        };
      } catch (e) {
        setWsConnected(false);
      }
    };

    connectWebSocket();

    fetchData();
    const interval = setInterval(fetchData, 3000);

    return () => {
      clearInterval(interval);
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    };
  }, []);

  const handleToggleSimulation = async () => {
    try {
      if (isSimulating) {
        await fetch(`${API_BASE}/api/simulation/stop`, { method: 'POST' });
        setIsSimulating(false);
      } else {
        await fetch(`${API_BASE}/api/simulation/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ interval_seconds: 3.0 })
        });
        setIsSimulating(true);
      }
      fetchData();
    } catch (e) {
      console.error('Failed to toggle simulation:', e);
    }
  };

  const handleStepSimulation = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/simulation/step`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.step_result) {
          setLatestLiveEvent({
            event_type: data.step_result.event_type,
            description: data.step_result.description,
            timestamp: data.step_result.timestamp
          });
        }
      }
      fetchData();
    } catch (e) {
      console.error('Failed to step simulation:', e);
    }
  };

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
      console.warn('API error during memory search', e);
    }
    return { results: [], search_ms: 0.9 };
  };

  const handleAdjudicate = async (payload: any) => {
    const res = await fetch(`${API_BASE}/api/disputes/adjudicate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      throw new Error(`Adjudication failed: backend returned ${res.status}. Memory-backed arbitration requires the Sibyl backend to be running.`);
    }
    const data = await res.json();
    fetchData();
    return data;
  };

  const handleAssessRisk = async (agentId: string, amount: number) => {
    try {
      const res = await fetch(`${API_BASE}/api/underwrite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_id: agentId, amount_usdc: amount })
      });
      if (!res.ok) {
        throw new Error(`Underwriting failed: ${res.status}`);
      }
      return await res.json();
    } catch (e) {
      console.error('Credit desk requires backend with Sibyl Memory:', e);
      throw e;
    }
  };

  const handleRunLitmusTest = async (scenario: string = 'RECIDIVISM'): Promise<LitmusTestReport> => {
    try {
      const res = await fetch(`${API_BASE}/api/litmus/run?scenario=${scenario}`, {
        method: 'POST'
      });
      if (!res.ok) {
        throw new Error(`Litmus benchmark failed: ${res.status}`);
      }
      const data = await res.json();
      fetchData();
      return data;
    } catch (e) {
      console.error('Litmus test requires backend with Sibyl Memory:', e);
      throw e;
    }
  };

  const handleResetMemory = async () => {
    setIsResetting(true);
    try {
      await fetch(`${API_BASE}/api/memory/reset`, { method: 'POST' });
      setIsSimulating(false);
      setLatestLiveEvent(null);
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
        isSimulating={isSimulating}
        onToggleSimulation={handleToggleSimulation}
        onStepSimulation={handleStepSimulation}
        wsConnected={wsConnected}
      />

      <main style={{ flex: 1, maxWidth: '1400px', width: '100%', margin: '0 auto', padding: '1.5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {/* Real-Time Live Activity Event Ticker */}
        {latestLiveEvent && (
          <div
            className="panel-inset"
            style={{
              padding: '0.65rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: latestLiveEvent.event_type === 'DISPUTE_SLASHED' ? 'var(--accent-rose-subtle)' : 'var(--accent-emerald-subtle)',
              border: latestLiveEvent.event_type === 'DISPUTE_SLASHED' ? '1px solid var(--accent-rose-border)' : '1px solid var(--accent-emerald-border)',
              borderRadius: 'var(--radius-md)',
              animation: 'fadeIn 0.3s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              {latestLiveEvent.event_type === 'DISPUTE_SLASHED' ? (
                <ShieldAlert size={16} color="var(--accent-rose)" />
              ) : (
                <Zap size={16} color="var(--accent-emerald)" />
              )}
              <span className="font-mono" style={{ fontSize: '0.74rem', fontWeight: 700, color: latestLiveEvent.event_type === 'DISPUTE_SLASHED' ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>
                {latestLiveEvent.event_type}:
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>
                {latestLiveEvent.description}
              </span>
            </div>

            <span className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {new Date(latestLiveEvent.timestamp).toLocaleTimeString()}
            </span>
          </div>
        )}

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
