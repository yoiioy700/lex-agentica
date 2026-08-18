"""A2A Commercial Code & Standard Legal Statutes for Autonomous Agentic Commerce.
Stored in Sibyl's REFERENCE Tier for instant judicial consultation.
"""

from typing import Dict, List

DEFAULT_STATUTES: List[Dict[str, str]] = [
    {
        "code": "A2A-§401",
        "title": "Data Freshness & Staleness Breach",
        "category": "DATA_ORACLE",
        "content": (
            "An agent providing market data or oracle feeds must ensure that the returned timestamp is within "
            "the agreed SLA latency window. If data is stale by >150% of the SLA threshold without prior force-majeure "
            "oracle disruption notice, the worker agent commits a Material Data Breach subject to a 100% escrow refund "
            "and a mandatory credit downgrade of at least 50 points."
        ),
        "tags": ["data", "oracle", "staleness", "sla_breach", "refund"]
    },
    {
        "code": "A2A-§402",
        "title": "Substandard Delivery & Pro-Rata Allocation",
        "category": "INFERENCE_WORK",
        "content": (
            "When deliverable accuracy falls between 70% and 95% of the contractual SLA, the Arbiter shall avoid total "
            "slashing and instead enforce an equitable Pro-Rata settlement (e.g. 50% payout to Worker, 50% refund to Buyer). "
            "Both agents retain neutral reputation impact unless recidivism is demonstrated."
        ),
        "tags": ["pro_rata", "partial_delivery", "inference", "equitable_settlement"]
    },
    {
        "code": "A2A-§403",
        "title": "Malicious Payload & System Infiltration Slasher",
        "category": "SECURITY",
        "content": (
            "Any submission containing prompt injections, exploit payloads, or malicious bytecode constitutes an "
            "Aggravated Bad-Faith Breach. The Arbiter shall execute an immediate 100% escrow slash, forfeit 100% of collateral, "
            "downgrade the offending agent to Rating D (Default/Blacklisted), and permanently publish the agent hash to "
            "the global threat blacklist in the ARCHIVE tier."
        ),
        "tags": ["security", "malicious_payload", "blacklist", "rating_d", "full_slash"]
    },
    {
        "code": "A2A-§404",
        "title": "Unjustified Dispute & Frivolous Claim Penalty",
        "category": "PROCEDURAL",
        "content": (
            "If a Buyer agent initiates a dispute where the Worker deliverable matches 100% of cryptographic SLA hashes "
            "and timestamp verifications, the claim shall be dismissed with prejudice. The Buyer agent shall forfeit 10% "
            "of the mandate value as an administrative arbitration fee credited to the Arbiter pool."
        ),
        "tags": ["frivolous_claim", "buyer_penalty", "cryptographic_proof", "dismissal"]
    },
    {
        "code": "A2A-§405",
        "title": "Autonomous Credit Underwriting & Default Margin",
        "category": "CREDIT_POLICY",
        "content": (
            "Agents with a Credit Rating below BBB (<600 score) or with 1+ unresolved defaults in the past 30 days "
            "are prohibited from executing uncollateralized mandates. The underwriter must mandate a minimum of "
            "150% to 200% on-chain collateral deposited in Base Escrow prior to work authorization."
        ),
        "tags": ["credit_underwriting", "collateral", "risk_margin", "rating_policy"]
    }
]

DEFAULT_INITIAL_PRECEDENTS: List[Dict[str, str]] = [
    {
        "case_id": "CASE-2026-088",
        "title": "Nexus-Oracle vs Apex-Fund: Stale Eth/Usd Feeds",
        "breach_code": "A2A-§401",
        "summary": "Nexus-Oracle provided feed delayed by 18 seconds (SLA was 3s max). Arbitrated 100% refund to Buyer. Nexus rating reduced from AA to BBB.",
        "tags": ["precedent", "oracle", "stale_data", "CASE-2026-088"]
    },
    {
        "case_id": "CASE-2026-094",
        "title": "Synthetix-Coder vs Quant-LLC: Partial Function Completion",
        "breach_code": "A2A-§402",
        "summary": "Worker agent delivered 8/10 required microservices. Arbiter awarded 75% payment to Worker and 25% refund to Buyer with zero penalty.",
        "tags": ["precedent", "partial_work", "pro_rata", "CASE-2026-094"]
    }
]
