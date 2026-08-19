"""Virtuals Protocol Agent Communication Protocol (ACP) v2.0 Wrapper & Coordinator.
Enables standardized A2A message exchange, job handshakes, cryptographic signature verification,
and dispute escalation for the Virtuals ecosystem.
"""

from datetime import datetime, timezone
from enum import Enum
import hmac
import hashlib
import json
import time
from typing import Any, Dict, List, Optional, Tuple
from pydantic import BaseModel, Field


class ACPMessageType(str, Enum):
    HANDSHAKE_INIT = "ACP_HANDSHAKE_INIT"
    PROPOSAL_QUOTE = "ACP_PROPOSAL_QUOTE"
    MANDATE_LOCKED = "ACP_MANDATE_LOCKED"
    DELIVERABLE_SUBMISSION = "ACP_DELIVERABLE_SUBMISSION"
    DISPUTE_ESCALATION = "ACP_DISPUTE_ESCALATION"
    SETTLEMENT_RECEIPT = "ACP_SETTLEMENT_RECEIPT"


class VirtualsAgentProfile(BaseModel):
    agent_id: str
    name: str
    virtuals_tier: str
    reputation_token: str
    acp_endpoint: str
    public_key: str
    verified: bool = True


class ACPMessagePacket(BaseModel):
    message_id: str
    message_type: ACPMessageType
    sender_agent_id: str
    recipient_agent_id: str
    session_id: str
    payload: Dict[str, Any]
    signature: str
    protocol_version: str = "ACP/2.0"
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class VirtualsACPCoordinator:
    """Manages Agent Commerce Protocol (ACP) message routing and cryptographic verification."""

    def __init__(self):
        self.message_log: List[ACPMessagePacket] = []
        self._shared_secrets: Dict[str, str] = {
            "agent_alpha_data": "secret_alpha_virtuals_2026",
            "agent_beta_oracle": "secret_beta_virtuals_2026",
            "agent_rogue_miner": "secret_rogue_virtuals_2026",
            "agent_client_apex": "secret_apex_virtuals_2026",
            "lex_arbiter_court": "secret_arbiter_master_key"
        }
        self.active_virtuals_agents: Dict[str, VirtualsAgentProfile] = {
            "agent_alpha_data": VirtualsAgentProfile(
                agent_id="agent_alpha_data",
                name="Alpha Data Scraper 9000",
                virtuals_tier="COGNITIVE_WORKER",
                reputation_token="$ALPHA_DATA",
                acp_endpoint="virtuals://acp.worker.alpha",
                public_key="0x04a8b71d99e52e4f0145c26b8e8f81239c4a8b71d99e52e4f0145c26b8e8f812"
            ),
            "agent_beta_oracle": VirtualsAgentProfile(
                agent_id="agent_beta_oracle",
                name="Beta Price Streamer",
                virtuals_tier="ORACLE_STREAMER",
                reputation_token="$BETA_FEED",
                acp_endpoint="virtuals://acp.worker.beta",
                public_key="0x04b9c82e00f63f5a1256d37c9f9a92340d5b9c82e00f63f5a1256d37c9f9a923"
            ),
            "agent_rogue_miner": VirtualsAgentProfile(
                agent_id="agent_rogue_miner",
                name="Rogue Sub-LLM Miner",
                virtuals_tier="EXPERIMENTAL_MINER",
                reputation_token="$ROGUE_LLM",
                acp_endpoint="virtuals://acp.worker.rogue",
                public_key="0x04c0d93f11a74a6b2367e48d0a0b03451e6c0d93f11a74a6b2367e48d0a0b034"
            ),
            "agent_client_apex": VirtualsAgentProfile(
                agent_id="agent_client_apex",
                name="Apex Treasury Fund",
                virtuals_tier="CAPITAL_DEPLOYER",
                reputation_token="$APEX_FUND",
                acp_endpoint="virtuals://acp.client.apex",
                public_key="0x04d1ea4a22b85b7c3478f59e1b1c14562f7d1ea4a22b85b7c3478f59e1b1c145"
            )
        }

    def _generate_signature(self, sender_id: str, message_body: str) -> str:
        secret = self._shared_secrets.get(sender_id, "default_virtuals_shared_secret")
        return "0x" + hmac.new(secret.encode("utf-8"), message_body.encode("utf-8"), hashlib.sha256).hexdigest()

    def verify_message_signature(self, packet: ACPMessagePacket) -> bool:
        """Verifies HMAC/ECDSA authenticity of incoming ACP packet."""
        raw_body = f"{packet.message_id}|{packet.sender_agent_id}|{packet.recipient_agent_id}|{packet.session_id}|{json.dumps(packet.payload, sort_keys=True)}"
        expected_sig = self._generate_signature(packet.sender_agent_id, raw_body)
        return hmac.compare_digest(packet.signature, expected_sig)

    def create_acp_packet(
        self,
        msg_type: ACPMessageType,
        sender_id: str,
        recipient_id: str,
        session_id: str,
        payload: Dict[str, Any]
    ) -> ACPMessagePacket:
        """Constructs and cryptographically signs a Virtuals ACP packet."""
        msg_id = f"ACP-v2-{int(time.time() * 1000)}-{sender_id[:6]}"
        raw_body = f"{msg_id}|{sender_id}|{recipient_id}|{session_id}|{json.dumps(payload, sort_keys=True)}"
        signature = self._generate_signature(sender_id, raw_body)

        packet = ACPMessagePacket(
            message_id=msg_id,
            message_type=msg_type,
            sender_agent_id=sender_id,
            recipient_agent_id=recipient_id,
            session_id=session_id,
            payload=payload,
            signature=signature,
            protocol_version="ACP/2.0",
            timestamp=datetime.now(timezone.utc).isoformat()
        )
        self.message_log.append(packet)
        return packet

    def broadcast_dispute_notice(
        self,
        mandate_id: str,
        plaintiff_id: str,
        defendant_id: str,
        reason: str
    ) -> ACPMessagePacket:
        """Broadcasts an urgent dispute notice across the Virtuals network."""
        return self.create_acp_packet(
            msg_type=ACPMessageType.DISPUTE_ESCALATION,
            sender_id=plaintiff_id,
            recipient_id="lex_arbiter_court",
            session_id=mandate_id,
            payload={
                "mandate_id": mandate_id,
                "defendant_id": defendant_id,
                "reason": reason,
                "escrow_standard": "BASE_SEPOLIA_ERC402",
                "court_docket_status": "PENDING_ARBITRATION"
            }
        )

    def get_recent_messages(self, limit: int = 30) -> List[ACPMessagePacket]:
        """Returns chronological stream of ACP packets."""
        return list(reversed(self.message_log[-limit:]))
