export type MemoryTier = 'HOT' | 'WARM' | 'COLD' | 'REFERENCE' | 'ARCHIVE';

export type CreditRating = 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'B' | 'CCC' | 'D';

export type RulingType =
  | 'PLAINTIFF_FULL_REFUND'
  | 'DEFENDANT_FULL_PAYOUT'
  | 'PARTIAL_SPLIT'
  | 'REJECTED';

export interface SLA {
  category: string;
  max_latency_ms: number;
  required_accuracy_pct: number;
  schema_version?: string;
  custom_rules?: Record<string, any>;
}

export interface Mandate {
  mandate_id: string;
  buyer_agent_id: string;
  worker_agent_id: string;
  title: string;
  amount_usdc: number;
  required_collateral_usdc: number;
  sla: SLA;
  created_at: string;
  deadline_ts: string;
  status: 'ACTIVE' | 'COMPLETED' | 'DISPUTED' | 'RESOLVED' | 'CANCELLED';
  deliverable_hash?: string;
  escrow_tx_hash?: string;
  settlement_tx_hash?: string;
}

export interface DisputeClaim {
  claim_id: string;
  mandate_id: string;
  plaintiff_agent_id: string;
  defendant_agent_id: string;
  reason: string;
  alleged_breach_code: string;
  evidence_payload: Record<string, any>;
  created_at: string;
}

export interface CaseRuling {
  case_id: string;
  mandate_id: string;
  ruling_type: RulingType;
  slash_percentage: number;
  plaintiff_award_usdc: number;
  defendant_award_usdc: number;
  legal_rationale: string;
  cited_statutes: string[];
  cited_precedents: string[];
  onchain_tx_hash?: string;
  adjudicated_at: string;
}

export interface CreditDossier {
  agent_id: string;
  name: string;
  credit_score: number;
  rating: CreditRating;
  total_deals: number;
  successful_deals: number;
  default_count: number;
  dispute_loss_count: number;
  total_volume_usdc: number;
  required_collateral_ratio: number;
  max_credit_limit_usdc: number;
  risk_flags: string[];
  last_updated: string;
}

export interface MemoryRecord {
  id: string;
  tier: MemoryTier;
  title: string;
  content: string;
  entity_id?: string;
  tags: string[];
  metadata: Record<string, any>;
  created_at: string;
  score?: number;
  search_ms?: number;
}

export interface LitmusTestStep {
  step_name: string;
  description: string;
  memory_on_action: string;
  memory_off_action: string;
  divergence_explained: string;
  loss_prevented_usdc: number;
}

export interface LitmusTestReport {
  test_id: string;
  scenario_title: string;
  gate_passed: boolean;
  cold_start_recall_ms: number;
  capital_loss_prevented_usdc: number;
  memory_on_outcome: string;
  memory_off_failure_mode: string;
  steps: LitmusTestStep[];
  statutes_invoked: string[];
  precedents_recalled: string[];
}

export interface BaseOnchainTxReceipt {
  tx_hash: string;
  block_number: number;
  chain_id: number;
  network_name: string;
  contract_address: string;
  event_name: string;
  gas_used: number;
  explorer_url: string;
  timestamp: string;
}

export interface ACPMessagePacket {
  message_id: string;
  message_type: string;
  sender_agent_id: string;
  recipient_agent_id: string;
  session_id: string;
  payload: Record<string, any>;
  signature: string;
  timestamp: string;
}

export interface SystemStatus {
  status: string;
  system_name: string;
  hackathon: string;
  partner_multipliers: {
    base_multiplier: number;
    virtuals_multiplier: number;
    total_effective_multiplier: number;
  };
  load_bearing_gate: {
    status: string;
    score_weight: string;
  };
  memory_tier_counts: Record<string, number>;
  total_records: number;
  base_sepolia_contract: string;
}
