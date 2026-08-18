"""Virtuals Protocol Agent Communication Protocol (ACP) Wrapper & Coordinator.
Enables standardized A2A message exchange, job handshakes, and dispute escalation for the Virtuals ecosystem.
"""

from datetime import datetime, timezone
from enum import Enum
import hashlib
import json
import time
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ACPMessageType(str, Enum):
    JOB_REQUEST = "ACP_JOB_REQUEST"
    PROPOSAL_QUOTE = "ACP_PROPOSAL_QUOTE"
    MANDATE_LOCKED = "ACP_MANDATE_LOCKED"
    DELIVERABLE_SUBMISSION = "ACP_DELIVERABLE_SUBMISSION"
    DISPUTE_ESCALATION = "ACP_DISPUTE_ESCALATION"
    SETTLEMENT_RECEIPT = "ACP_SETTLEMENT_RECEIPT"


class ACPMessagePacket(BaseModel):
    message_id: str
    message_type: ACPMessageType
    sender_agent_id: str
    recipient_agent_id: str
    session_id: str
    payload: Dict[str, Any]
    signature: str
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class VirtualsACPCoordinator:
    def __init__(self):
        self.message_log: List[ACPMessagePacket] = []
        self.active_virtuals_agents: Dict[str, Dict[str, Any]] = {
            "agent_alpha_data": {
                "name": "Alpha Data Scraper 9000",
                "virtuals_tier": "COGNITIVE_WORKER",
                "reputation_token": "$ALPHA_DATA",
                "acp_endpoint": "virtuals://acp.worker.alpha"
            },
            "agent_beta_oracle": {
                "name": "Beta Price Streamer",
                "virtuals_tier": "ORACLE_STREAMER",
                "reputation_token": "$BETA_FEED",
                "acp_endpoint": "virtuals://acp.worker.beta"
            },
            "agent_rogue_miner": {
                "name": "Rogue Sub-LLM Miner",
                "virtuals_tier": "EXPERIMENTAL_MINER",
                "reputation_token": "$ROGUE_LLM",
                "acp_endpoint": "virtuals://acp.worker.rogue"
            },
            "agent_client_apex": {
                "name": "Apex Treasury Fund",
                "virtuals_tier": "CAPITAL_DEPLOYER",
                "reputation_token": "$APEX_FUND",
                "acp_endpoint": "virtuals://acp.client.apex"
            }
        }

    def create_acp_packet(
        self,
        msg_type: ACPMessageType,
        sender_id: str,
        recipient_id: str,
        session_id: str,
        payload: Dict[str, Any]
    ) -> ACPMessagePacket:
        msg_id = f"ACP-{int(time.time() * 1000)}-{sender_id[:6]}"
        raw_body = f"{msg_id}|{sender_id}|{recipient_id}|{json.dumps(payload)}"
        signature = "0x" + hashlib.sha256(raw_body.encode()).hexdigest()

        packet = ACPMessagePacket(
            message_id=msg_id,
            message_type=msg_type,
            sender_agent_id=sender_id,
            recipient_agent_id=recipient_id,
            session_id=session_id,
            payload=payload,
            signature=signature
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
        return self.create_acp_packet(
            msg_type=ACPMessageType.DISPUTE_ESCALATION,
            sender_id=plaintiff_id,
            recipient_id="lex_arbiter_court",
            session_id=mandate_id,
            payload={
                "mandate_id": mandate_id,
                "defendant_id": defendant_id,
                "reason": reason,
                "escrow_standard": "BASE_SEP_ERC402"
            }
        )

    def get_recent_messages(self, limit: int = 20) -> List[ACPMessagePacket]:
        return list(reversed(self.message_log[-limit:]))
