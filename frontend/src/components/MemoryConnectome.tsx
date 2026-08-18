import React, { useState, useEffect } from 'react';
import { Search, Flame, UserCheck, BookOpen, Archive, History, Sparkles, Layers } from 'lucide-react';
import type { MemoryRecord, MemoryTier } from '../types';

interface MemoryConnectomeProps {
  onSearch: (query: string, tier?: string) => Promise<{ results: MemoryRecord[]; search_ms: number }>;
  initialCounts: Record<string, number>;
}

const TIER_CONFIG = [
  {
    tier: 'HOT',
    label: '1. HOT State',
    desc: 'Active mandates & pending SLA deadlines',
    tagClass: 'tag-rose',
    icon: Flame,
    color: 'var(--accent-rose)'
  },
  {
    tier: 'WARM',
    label: '2. WARM Entities',
    desc: 'Counterparty credit scores & risk dossiers',
    tagClass: 'tag-cyan',
    icon: UserCheck,
    color: 'var(--accent-primary)'
  },
  {
    tier: 'COLD',
    label: '3. COLD Journal',
    desc: 'Chronological on-chain execution receipts',
    tagClass: 'tag-indigo',
    icon: History,
    color: 'var(--accent-indigo)'
  },
  {
    tier: 'REFERENCE',
    label: '4. REFERENCE',
    desc: 'A2A Commercial Code (§401 - §405)',
    tagClass: 'tag-emerald',
    icon: BookOpen,
    color: 'var(--accent-emerald)'
  },
  {
    tier: 'ARCHIVE',
    label: '5. ARCHIVE',
    desc: 'Dispute precedent rulings & case law',
    tagClass: 'tag-amber',
    icon: Archive,
    color: 'var(--accent-amber)'
  }
];

export const MemoryConnectome: React.FC<MemoryConnectomeProps> = ({ onSearch, initialCounts }) => {
  const [activeTier, setActiveTier] = useState<MemoryTier | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MemoryRecord[]>([]);
  const [searchLatency, setSearchLatency] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  const performSearch = async (q: string, tier: MemoryTier | 'ALL') => {
    setIsLoading(true);
    try {
      const tierParam = tier === 'ALL' ? undefined : tier;
      const res = await onSearch(q || 'oracle statute breach collateral rating', tierParam);
      setSearchResults(res.results || []);
      setSearchLatency(res.search_ms || 0.85);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    performSearch(searchQuery, activeTier);
  }, [activeTier]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchQuery, activeTier);
  };

  const quickKeywords = ['stale data', 'malicious payload', 'collateral', '§401', 'substandard'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 5-Tier Overview Section */}
      <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <Layers size={18} color="var(--accent-primary)" />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Sibyl 5-Tier Memory Controller</h2>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Sub-2.5ms SQLite FTS5 Full-Text Indexing with BM25 Relevance Ranking (Zero Embeddings)
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="tag tag-emerald">Zero Embedding Cost</span>
            <span className="tag tag-cyan">BM25 Ranking</span>
            <span className="tag tag-neutral">Porter Stemmer</span>
          </div>
        </div>

        {/* 5 Tier Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
          {TIER_CONFIG.map((item) => {
            const IconComponent = item.icon;
            const isSelected = activeTier === item.tier;
            const count = initialCounts[item.tier] || 0;
            return (
              <div
                key={item.tier}
                onClick={() => setActiveTier(item.tier as MemoryTier)}
                className="panel-interactive"
                style={{
                  cursor: 'pointer',
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  background: isSelected ? 'var(--bg-surface-raised)' : 'var(--bg-surface-inset)',
                  border: isSelected ? `1px solid ${item.color}` : '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.45rem',
                  boxShadow: isSelected ? `0 0 16px ${item.color}33` : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', color: isSelected ? '#ffffff' : 'var(--text-main)' }}>
                    <IconComponent size={15} color={item.color} />
                    {item.label}
                  </span>
                  <span className={`tag ${item.tagClass}`} style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem' }}>
                    {count}
                  </span>
                </div>
                <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: '1.35' }}>{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Query Terminal & Search Results */}
      <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search keyword in memory index (e.g. 'stale data', 'malicious', 'collateral', '§401')..."
              className="input-control font-mono"
              style={{ paddingLeft: '2.25rem' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            <Sparkles size={14} />
            {isLoading ? 'Querying...' : 'FTS5 Search'}
          </button>
        </form>

        {/* Quick Suggestion Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.75rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Quick Filters:</span>
          {quickKeywords.map((kw) => (
            <button
              key={kw}
              type="button"
              onClick={() => {
                setSearchQuery(kw);
                performSearch(kw, activeTier);
              }}
              className="btn btn-ghost"
              style={{ padding: '0.2rem 0.55rem', fontSize: '0.72rem', borderRadius: 'var(--radius-sm)' }}
            >
              #{kw}
            </button>
          ))}
          {activeTier !== 'ALL' && (
            <button
              type="button"
              onClick={() => setActiveTier('ALL')}
              className="btn btn-ghost"
              style={{ padding: '0.2rem 0.55rem', fontSize: '0.72rem', color: 'var(--accent-primary)' }}
            >
              Reset Tier Filter (ALL)
            </button>
          )}
        </div>

        {/* Search Results Summary Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.6rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span>Active Tier: <strong style={{ color: 'var(--accent-primary)' }}>{activeTier}</strong></span>
            <span>Matched: <strong style={{ color: 'var(--text-main)' }}>{searchResults.length} records</strong></span>
          </div>
          <span className="font-mono" style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>
            ⚡ Execution: {searchLatency.toFixed(2)} ms
          </span>
        </div>

        {/* Results Stream */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '550px', overflowY: 'auto' }}>
          {searchResults.length === 0 ? (
            <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No records found matching your query. Try selecting <strong>ALL</strong> or searching for "oracle", "statute", or "collateral".
            </div>
          ) : (
            searchResults.map((rec) => {
              const tierMatch = TIER_CONFIG.find((t) => t.tier === rec.tier);
              return (
                <div key={rec.id} className="panel-inset" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className={`tag ${tierMatch?.tagClass || 'tag-neutral'}`}>
                        {rec.tier}
                      </span>
                      <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{rec.title}</strong>
                    </div>

                    <span className="font-mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      ID: {rec.id}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    {rec.content}
                  </p>

                  {rec.tags && rec.tags.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.2rem' }}>
                      {rec.tags.map((tag, idx) => (
                        <span key={idx} className="font-mono" style={{ fontSize: '0.68rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.03)', padding: '0.1rem 0.35rem', borderRadius: '3px' }}>
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
