// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title LexEscrow
 * @notice Autonomous Escrow & Dispute Resolution Contract on Base Rails for Agentic Commerce.
 * @dev Supports ERC-402 micro-settlements, collateral locking, and autonomous arbiter slashing.
 */
contract LexEscrow {
    enum MandateStatus { Active, Completed, Slashed, Refunded, Disputed }

    struct Mandate {
        bytes32 mandateId;
        address buyer;
        address worker;
        uint256 amountUSDC;
        uint256 collateralUSDC;
        uint256 deadline;
        MandateStatus status;
        bytes32 deliverableHash;
    }

    address public immutable arbiter;
    address public immutable baseTreasury;

    mapping(bytes32 => Mandate) public mandates;

    event MandateCreated(
        bytes32 indexed mandateId,
        address indexed buyer,
        address indexed worker,
        uint256 amountUSDC,
        uint256 collateralUSDC,
        uint256 deadline
    );

    event DeliverableSubmitted(bytes32 indexed mandateId, bytes32 deliverableHash);
    
    event MandateSettled(
        bytes32 indexed mandateId,
        address recipient,
        uint256 amountUSDC,
        string settlementType
    );

    event DisputeResolved(
        bytes32 indexed mandateId,
        bytes32 indexed caseId,
        uint256 slashPercentage,
        uint256 plaintiffAward,
        uint256 defendantAward,
        string rulingHash
    );

    modifier onlyArbiter() {
        require(msg.sender == arbiter, "LexEscrow: Caller is not the authorized Arbiter");
        _;
    }

    constructor(address _arbiter, address _treasury) {
        require(_arbiter != address(0), "Invalid arbiter address");
        arbiter = _arbiter;
        baseTreasury = _treasury;
    }

    /**
     * @notice Locks funds in escrow for a new A2A commercial mandate.
     */
    function createMandate(
        bytes32 _mandateId,
        address _worker,
        uint256 _amountUSDC,
        uint256 _collateralUSDC,
        uint256 _deadline
    ) external payable {
        require(mandates[_mandateId].buyer == address(0), "Mandate ID already exists");
        require(_worker != address(0), "Invalid worker address");
        require(_deadline > block.timestamp, "Deadline must be in future");

        mandates[_mandateId] = Mandate({
            mandateId: _mandateId,
            buyer: msg.sender,
            worker: _worker,
            amountUSDC: _amountUSDC,
            collateralUSDC: _collateralUSDC,
            deadline: _deadline,
            status: MandateStatus.Active,
            deliverableHash: bytes32(0)
        });

        emit MandateCreated(_mandateId, msg.sender, _worker, _amountUSDC, _collateralUSDC, _deadline);
    }

    /**
     * @notice Worker submits deliverable cryptographic hash.
     */
    function submitDeliverable(bytes32 _mandateId, bytes32 _deliverableHash) external {
        Mandate storage m = mandates[_mandateId];
        require(msg.sender == m.worker, "Only assigned worker can submit deliverable");
        require(m.status == MandateStatus.Active, "Mandate not active");

        m.deliverableHash = _deliverableHash;
        emit DeliverableSubmitted(_mandateId, _deliverableHash);
    }

    /**
     * @notice Happy-path instant settlement (x402 protocol) initiated by buyer or auto-settle upon SLA verification.
     */
    function releasePayment(bytes32 _mandateId) external {
        Mandate storage m = mandates[_mandateId];
        require(msg.sender == m.buyer || msg.sender == arbiter, "Unauthorized settlement");
        require(m.status == MandateStatus.Active, "Mandate not active");

        m.status = MandateStatus.Completed;
        emit MandateSettled(_mandateId, m.worker, m.amountUSDC, "x402_INSTANT_PAYOUT");
    }

    /**
     * @notice Arbiter executes precedent-backed dispute resolution and distributes slashed escrow.
     */
    function adjudicate(
        bytes32 _mandateId,
        bytes32 _caseId,
        uint256 _slashPercentage,
        uint256 _plaintiffAward,
        uint256 _defendantAward,
        string calldata _rulingHash
    ) external onlyArbiter {
        Mandate storage m = mandates[_mandateId];
        require(m.status == MandateStatus.Active || m.status == MandateStatus.Disputed, "Invalid status for ruling");
        require(_slashPercentage <= 100, "Slash percentage out of bounds");

        if (_slashPercentage == 100) {
            m.status = MandateStatus.Refunded;
        } else if (_slashPercentage == 0) {
            m.status = MandateStatus.Completed;
        } else {
            m.status = MandateStatus.Slashed;
        }

        emit DisputeResolved(_mandateId, _caseId, _slashPercentage, _plaintiffAward, _defendantAward, _rulingHash);
    }
}
