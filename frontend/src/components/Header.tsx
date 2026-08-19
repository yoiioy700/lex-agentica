import React from 'react';
import { Scale, Cpu, ShieldCheck, Zap, RotateCcw, Link2, Activity, Play, Square, FastForward } from 'lucide-react';
import type { SystemStatus } from '../types';

interface HeaderProps {
  status: SystemStatus | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onResetMemory: () => void;
  isResetting: boolean;
  isSimulating: boolean;
  onToggleSimulation: () => void;
  onStepSimulation: () => void;
  wsConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  activeTab,
  setActiveTab,
  onResetMemory,
  isResetting,
  isSimulating,
  onToggleSimulation,
  onStepSimulation,
  wsConnected
}) => {
  return (
    <header style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(11, 16, 27, 0.85)', backdropFilter: 'blur(16px)', position: 'sticky', top: 0, zIndex: 50 }}>
      {/* Top Telemetry Strip */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0.45rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--accent-emerald)', boxShadow: '0 0 8px var(--accent-emerald)', display: 'inline-block' }} />
            <strong style={{ color: 'var(--text-main)', letterSpacing: '0.02em' }}>SIBYL LABS HACKATHON 2026</strong>
          </div>
          <span style={{ color: 'var(--text-faint)' }}>•</span>
          <span className="tag tag-cyan">
            <Cpu size={12} />
            Memory Gate: {status?.load_bearing_gate?.score_weight || '40%'}
          </span>
          <span className="tag tag-emerald">
            <Link2 size={12} />
            Base Rails (+15%)
          </span>
          <span className="tag tag-indigo">
            <Zap size={12} />
            Virtuals ACP (+10%)
          </span>
          <span className="tag tag-neutral" style={{ fontSize: '0.68rem' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: wsConnected ? 'var(--accent-emerald)' : 'var(--accent-amber)', display: 'inline-block' }} />
            {wsConnected ? 'Live WS Feed' : 'Fast Polling'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {/* Live Autonomous Economy Simulation Controls */}
          <button
            onClick={onToggleSimulation}
            className={`btn ${isSimulating ? 'btn-danger' : 'btn-primary'}`}
            style={{ padding: '0.25rem 0.75rem', fontSize: '0.74rem', fontWeight: 700 }}
            title="Toggle autonomous background agent commerce simulation"
          >
            {isSimulating ? <Square size={12} /> : <Play size={12} />}
            {isSimulating ? 'Stop Live Agents' : '▶ Start Live Agents'}
          </button>

          <button
            onClick={onStepSimulation}
            disabled={isSimulating}
            className="btn btn-ghost"
            style={{ padding: '0.25rem 0.55rem', fontSize: '0.72rem' }}
            title="Execute 1 autonomous A2A market transaction"
          >
            <FastForward size={12} />
            Step 1x
          </button>

          <div className="font-mono" style={{ color: 'var(--accent-emerald)', fontWeight: 700, fontSize: '0.75rem', background: 'var(--accent-emerald-subtle)', padding: '0.15rem 0.5rem', borderRadius: '4px', border: '1px solid var(--accent-emerald-border)' }}>
            1.25× MAX
          </div>

          <button
            onClick={onResetMemory}
            disabled={isResetting}
            className="btn btn-ghost"
            style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem' }}
            title="Reset memory to clean baseline state"
          >
            <RotateCcw size={12} />
            {isResetting ? 'Resetting...' : 'Reset State'}
          </button>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0.85rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, #0284c7 0%, #6366f1 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)' }}>
            <Scale size={20} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1 style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #ffffff 60%, #94a3b8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                LEX AGENTICA
              </h1>
              <span className="tag tag-neutral" style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem' }}>v0.1</span>
              {isSimulating && (
                <span className="tag tag-rose font-mono" style={{ fontSize: '0.65rem', animation: 'pulse 1.5s infinite' }}>
                  ● LIVE A2A TRAFFIC
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              Persistent Legal & Credit Underwriting Infrastructure for A2A Commerce
            </p>
          </div>
        </div>

        {/* Fluid Pill Tabs */}
        <nav className="nav-pill-container">
          <button
            className={`nav-pill ${activeTab === 'courtroom' ? 'active' : ''}`}
            onClick={() => setActiveTab('courtroom')}
          >
            <Scale size={14} />
            Courtroom Docket
          </button>
          <button
            className={`nav-pill ${activeTab === 'memory' ? 'active' : ''}`}
            onClick={() => setActiveTab('memory')}
          >
            <Cpu size={14} />
            5-Tier Memory
          </button>
          <button
            className={`nav-pill ${activeTab === 'credit' ? 'active' : ''}`}
            onClick={() => setActiveTab('credit')}
          >
            <Zap size={14} />
            Credit Desk
          </button>
          <button
            className={`nav-pill ${activeTab === 'litmus' ? 'active' : ''}`}
            onClick={() => setActiveTab('litmus')}
          >
            <ShieldCheck size={14} />
            Litmus Benchmark
          </button>
          <button
            className={`nav-pill ${activeTab === 'onchain' ? 'active' : ''}`}
            onClick={() => setActiveTab('onchain')}
          >
            <Activity size={14} />
            Base & Virtuals Feed
          </button>
        </nav>
      </div>
    </header>
  );
};
