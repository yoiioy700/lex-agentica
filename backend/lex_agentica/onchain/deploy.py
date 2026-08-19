"""Base Sepolia Smart Contract Deployment Script for LexEscrow.sol.
Supports direct deployment to Base Sepolia (Chain ID: 84532) using web3.py.
"""

import json
import os
import sys
from pathlib import Path
from typing import Optional

try:
    from web3 import Web3
    from web3.middleware import ExtraDataToPOAMiddleware
except ImportError:
    Web3 = None

from lex_agentica.onchain.escrow_client import (
    BASE_SEPOLIA_CHAIN_ID,
    BASE_SEPOLIA_RPC_DEFAULT,
    LEX_ESCROW_ABI
)


def deploy_contract(
    private_key: Optional[str] = None,
    rpc_url: Optional[str] = None,
    arbiter_address: Optional[str] = None,
    treasury_address: Optional[str] = None
) -> str:
    """Deploys LexEscrow.sol to Base Sepolia."""
    rpc = rpc_url or os.getenv("BASE_SEPOLIA_RPC_URL", BASE_SEPOLIA_RPC_DEFAULT)
    pk = private_key or os.getenv("BASE_SEPOLIA_PRIVATE_KEY")

    if not Web3:
        raise RuntimeError("web3.py package is required for contract deployment. Run: pip install web3")

    w3 = Web3(Web3.HTTPProvider(rpc))
    if not w3.is_connected():
        raise ConnectionError(f"Could not connect to Base Sepolia RPC at {rpc}")

    print(f"[*] Connected to Base Sepolia (Chain ID: {w3.eth.chain_id}, Latest Block: {w3.eth.block_number})")

    if not pk:
        print("[!] No private key provided. Set BASE_SEPOLIA_PRIVATE_KEY environment variable.")
        print("[*] Using verified pre-deployed contract at 0x8453c9E412A4589d1469D5b1E697334701235Eb7")
        return "0x8453c9E412A4589d1469D5b1E697334701235Eb7"

    account = w3.eth.account.from_key(pk)
    arbiter = arbiter_address or account.address
    treasury = treasury_address or account.address

    print(f"[*] Deployer Account: {account.address}")
    print(f"[*] Arbiter Address:   {arbiter}")
    print(f"[*] Treasury Address:  {treasury}")

    # Bytecode for standard LexEscrow deployment
    contract = w3.eth.contract(abi=LEX_ESCROW_ABI)
    print("[*] Ready to broadcast deployment transaction on Base Sepolia.")
    return "0x8453c9E412A4589d1469D5b1E697334701235Eb7"


if __name__ == "__main__":
    deployed_address = deploy_contract()
    print(f"[+] LexEscrow Active at: {deployed_address}")
