import React from 'react';
import { Link2, Zap, ExternalLink, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import type { BaseOnchainTxReceipt, ACPMessagePacket } from '../types';

interface OnchainFeedProps {
  transactions: BaseOnchainTxReceipt[];
  acpMessages: ACPMessagePacket[];
  contractAddress: string;
}

export const OnchainFeed: React.FC<OnchainFeedProps> = ({
  transactions,
  acpMessages,
  contractAddress
}) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '1.5rem' }}>
      {/* Left Column: Base Sepolia On-Chain Escrow Feed */}
      <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <Link2 color="var(--accent-emerald)" size={18} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Base Sepolia Escrow Rails</h3>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              x402 Micro-Settlements, Slashing & Escrow Lock (+15% Hackathon Multiplier)
            </p>
          </div>
          <span className="tag tag-emerald">Chain ID: 84532</span>
        </div>

        <div className="panel-inset" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.76rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Contract Address:</span>
          <a
            href={`https://sepolia.basescan.org/address/${contractAddress}`}
            target="_blank"
            rel="noreferrer"
            style={{ color: 'var(--accent-emerald)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem', fontFamily: 'var(--font-mono)' }}
          >
            <span>{contractAddress}</span>
            <ExternalLink size={12} />
          </a>
        </div>

        {/* Transactions Stream */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '520px', overflowY: 'auto' }}>
          {transactions.length === 0 ? (
            <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              No on-chain transactions yet. Create a mandate or adjudicate a dispute to trigger Base settlement.
            </div>
          ) : (
            transactions.map((tx, idx) => (
              <div key={idx} className="panel-inset panel-interactive" style={{ padding: '0.85rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="tag tag-emerald">
                    <CheckCircle2 size={11} />
                    {tx.event_name}
                  </span>
                  <span className="font-mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Block #{tx.block_number}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.15rem' }}>
                  <span className="font-mono" style={{ fontSize: '0.82rem', color: 'var(--text-main)' }}>
                    {tx.tx_hash.slice(0, 16)}...{tx.tx_hash.slice(-8)}
                  </span>
                  <a
                    href={tx.explorer_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: 'var(--accent-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 600 }}
                  >
                    BaseScan <ArrowUpRight size={13} />
                  </a>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.35rem', marginTop: '0.15rem' }}>
                  <span>Gas: {tx.gas_used.toLocaleString()}</span>
                  <span>{new Date(tx.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Column: Virtuals Protocol ACP Message Stream */}
      <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <Zap color="var(--accent-indigo)" size={18} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Virtuals Protocol ACP Stream</h3>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Agent Communication Protocol Handshakes & Dispute Notices (+10% Multiplier)
            </p>
          </div>
          <span className="tag tag-indigo">ACP Standard v1</span>
        </div>

        {/* Message Log */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '580px', overflowY: 'auto' }}>
          {acpMessages.length === 0 ? (
            <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              No ACP packets broadcasted yet.
            </div>
          ) : (
            acpMessages.map((msg, idx) => (
              <div key={idx} className="panel-inset" style={{ padding: '0.85rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="tag tag-indigo">
                    {msg.message_type}
                  </span>
                  <span className="font-mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  <span className="font-mono" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{msg.sender_agent_id}</span>
                  <span>→</span>
                  <span className="font-mono" style={{ color: 'var(--accent-indigo)', fontWeight: 600 }}>{msg.recipient_agent_id}</span>
                </div>

                <div className="font-mono" style={{ background: 'var(--bg-surface-inset)', padding: '0.5rem 0.65rem', borderRadius: 'var(--radius-sm)', fontSize: '0.72rem', color: 'var(--text-secondary)', overflowX: 'auto', border: '1px solid var(--border-subtle)' }}>
                  Payload: {JSON.stringify(msg.payload)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
