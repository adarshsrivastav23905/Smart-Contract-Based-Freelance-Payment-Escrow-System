// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title FreelanceEscrow
 * @author Student Project — Smart Contract-Based Freelance Payment Escrow System
 * @notice A decentralized escrow contract for freelance payments.
 *         Clients lock funds in the contract; funds are released to the freelancer
 *         only after the client approves the submitted work. Supports cancellation,
 *         refunds, and basic dispute resolution via an arbitrator.
 *
 * @dev Security measures:
 *      - Checks-Effects-Interactions pattern on all ETH transfers
 *      - Custom reentrancy guard (nonReentrant modifier)
 *      - Strict state machine — every function requires a specific EscrowState
 *      - Role-based access control via onlyClient / onlyFreelancer / onlyArbitrator
 *      - Address and amount validation
 */

// ============================================================
//                        CONTRACT
// ============================================================

contract FreelanceEscrow {

    // --------------------------------------------------------
    //  1. ENUMS — Escrow lifecycle states
    // --------------------------------------------------------

    /**
     * @notice Represents every possible state of an escrow.
     *
     * State transitions:
     *   CREATED  → FUNDED  → IN_PROGRESS → SUBMITTED → COMPLETED
     *                 ↓            ↓            ↓
     *            CANCELLED    DISPUTED     DISPUTED
     *                             ↓            ↓
     *                        REFUNDED      REFUNDED / COMPLETED
     */
    enum EscrowState {
        CREATED,       // 0 — Escrow created, not yet funded
        FUNDED,        // 1 — Client deposited ETH
        IN_PROGRESS,   // 2 — Freelancer started working
        SUBMITTED,     // 3 — Freelancer submitted deliverables
        COMPLETED,     // 4 — Client approved; freelancer paid
        CANCELLED,     // 5 — Client cancelled before work started
        DISPUTED,      // 6 — Either party raised a dispute
        REFUNDED       // 7 — Funds returned to client
    }

    // --------------------------------------------------------
    //  2. STRUCTS — Escrow data model
    // --------------------------------------------------------

    /**
     * @notice Holds all data for a single escrow/project.
     */
    struct Escrow {
        uint256 id;               // Unique escrow identifier
        address payable client;   // The party who pays
        address payable freelancer; // The party who delivers work
        uint256 amount;           // Escrowed amount in wei
        string  projectTitle;     // Human-readable project name
        EscrowState state;        // Current lifecycle state
        uint256 createdAt;        // Block timestamp of creation
        uint256 fundedAt;         // Block timestamp of funding
        uint256 completedAt;      // Block timestamp of completion/refund
    }

    // --------------------------------------------------------
    //  3. STATE VARIABLES
    // --------------------------------------------------------

    /// @notice Auto-incrementing counter to generate unique escrow IDs.
    uint256 public escrowCount;

    /// @notice Address of the contract deployer who acts as arbitrator.
    address public arbitrator;

    /// @notice Mapping from escrow ID to its data.
    mapping(uint256 => Escrow) public escrows;

    /// @notice Simple reentrancy lock.
    bool private _locked;

    // --------------------------------------------------------
    //  4. EVENTS — On-chain activity log
    // --------------------------------------------------------

    /// @notice Emitted when a new escrow is created.
    event EscrowCreated(
        uint256 indexed escrowId,
        address indexed client,
        address indexed freelancer,
        uint256 amount,
        string  projectTitle
    );

    /// @notice Emitted when the client deposits funds.
    event FundsDeposited(
        uint256 indexed escrowId,
        address indexed client,
        uint256 amount
    );

    /// @notice Emitted when the freelancer starts work.
    event WorkStarted(
        uint256 indexed escrowId,
        address indexed freelancer
    );

    /// @notice Emitted when the freelancer submits deliverables.
    event WorkSubmitted(
        uint256 indexed escrowId,
        address indexed freelancer
    );

    /// @notice Emitted when the client approves and payment is released.
    event PaymentReleased(
        uint256 indexed escrowId,
        address indexed freelancer,
        uint256 amount
    );

    /// @notice Emitted when a refund is issued to the client.
    event RefundIssued(
        uint256 indexed escrowId,
        address indexed client,
        uint256 amount
    );

    /// @notice Emitted when a dispute is raised.
    event DisputeRaised(
        uint256 indexed escrowId,
        address indexed raisedBy
    );

    /// @notice Emitted when the arbitrator resolves a dispute.
    event DisputeResolved(
        uint256 indexed escrowId,
        bool    freelancerWins,
        address resolvedBy
    );

    // --------------------------------------------------------
    //  5. MODIFIERS — Access & state guards
    // --------------------------------------------------------

    /// @notice Prevents reentrancy attacks.
    modifier nonReentrant() {
        require(!_locked, "ReentrancyGuard: reentrant call");
        _locked = true;
        _;
        _locked = false;
    }

    /// @notice Restricts access to the escrow's client.
    modifier onlyClient(uint256 _escrowId) {
        require(
            msg.sender == escrows[_escrowId].client,
            "Only the client can call this"
        );
        _;
    }

    /// @notice Restricts access to the escrow's freelancer.
    modifier onlyFreelancer(uint256 _escrowId) {
        require(
            msg.sender == escrows[_escrowId].freelancer,
            "Only the freelancer can call this"
        );
        _;
    }

    /// @notice Restricts access to the arbitrator (contract deployer).
    modifier onlyArbitrator() {
        require(
            msg.sender == arbitrator,
            "Only the arbitrator can call this"
        );
        _;
    }

    /// @notice Requires the escrow to be in a specific state.
    modifier inState(uint256 _escrowId, EscrowState _state) {
        require(
            escrows[_escrowId].state == _state,
            "Invalid escrow state for this action"
        );
        _;
    }

    // --------------------------------------------------------
    //  6. CONSTRUCTOR
    // --------------------------------------------------------

    /**
     * @notice Sets the deployer as the arbitrator.
     */
    constructor() {
        arbitrator = msg.sender;
    }

    // --------------------------------------------------------
    //  7. CORE FUNCTIONS
    // --------------------------------------------------------

    /**
     * @notice Creates a new escrow between a client and a freelancer.
     * @param _freelancer  Address of the freelancer who will do the work.
     * @param _amount      The agreed payment amount in wei.
     * @param _projectTitle A short title for the project.
     * @return escrowId    The ID of the newly created escrow.
     *
     * @dev
     * - Validates freelancer address is not zero and not the client.
     * - Validates amount is greater than zero.
     * - State: none → CREATED.
     */
    function createEscrow(
        address payable _freelancer,
        uint256 _amount,
        string memory _projectTitle
    ) external returns (uint256 escrowId) {
        // --- Checks ---
        require(_freelancer != address(0), "Freelancer address cannot be zero");
        require(_freelancer != msg.sender, "Client cannot be the freelancer");
        require(_amount > 0, "Escrow amount must be greater than zero");
        require(bytes(_projectTitle).length > 0, "Project title cannot be empty");

        // --- Effects ---
        escrowId = escrowCount;
        escrowCount++;

        escrows[escrowId] = Escrow({
            id:           escrowId,
            client:       payable(msg.sender),
            freelancer:   _freelancer,
            amount:       _amount,
            projectTitle: _projectTitle,
            state:        EscrowState.CREATED,
            createdAt:    block.timestamp,
            fundedAt:     0,
            completedAt:  0
        });

        // --- Interactions (event only) ---
        emit EscrowCreated(escrowId, msg.sender, _freelancer, _amount, _projectTitle);
    }

    /**
     * @notice Client deposits the exact escrow amount into the contract.
     * @param _escrowId  The ID of the escrow to fund.
     *
     * @dev
     * - msg.value must equal the agreed amount.
     * - State: CREATED → FUNDED.
     */
    function fundEscrow(uint256 _escrowId)
        external
        payable
        onlyClient(_escrowId)
        inState(_escrowId, EscrowState.CREATED)
    {
        Escrow storage escrow = escrows[_escrowId];

        // --- Checks ---
        require(msg.value == escrow.amount, "Must send exact escrow amount");

        // --- Effects ---
        escrow.state = EscrowState.FUNDED;
        escrow.fundedAt = block.timestamp;

        // --- Interactions (event only) ---
        emit FundsDeposited(_escrowId, msg.sender, msg.value);
    }

    /**
     * @notice Freelancer acknowledges the project and starts working.
     * @param _escrowId  The ID of the escrow.
     *
     * @dev State: FUNDED → IN_PROGRESS.
     */
    function startWork(uint256 _escrowId)
        external
        onlyFreelancer(_escrowId)
        inState(_escrowId, EscrowState.FUNDED)
    {
        // --- Effects ---
        escrows[_escrowId].state = EscrowState.IN_PROGRESS;

        // --- Interactions (event only) ---
        emit WorkStarted(_escrowId, msg.sender);
    }

    /**
     * @notice Freelancer submits the completed deliverables for review.
     * @param _escrowId  The ID of the escrow.
     *
     * @dev State: IN_PROGRESS → SUBMITTED.
     */
    function submitWork(uint256 _escrowId)
        external
        onlyFreelancer(_escrowId)
        inState(_escrowId, EscrowState.IN_PROGRESS)
    {
        // --- Effects ---
        escrows[_escrowId].state = EscrowState.SUBMITTED;

        // --- Interactions (event only) ---
        emit WorkSubmitted(_escrowId, msg.sender);
    }

    /**
     * @notice Client approves the work and releases payment to the freelancer.
     * @param _escrowId  The ID of the escrow.
     *
     * @dev
     * - Uses checks-effects-interactions pattern.
     * - State: SUBMITTED → COMPLETED.
     * - Transfers the escrowed amount to the freelancer.
     */
    function approveAndRelease(uint256 _escrowId)
        external
        nonReentrant
        onlyClient(_escrowId)
        inState(_escrowId, EscrowState.SUBMITTED)
    {
        Escrow storage escrow = escrows[_escrowId];

        // --- Checks (done by modifiers) ---

        // --- Effects (state change BEFORE transfer) ---
        uint256 payment = escrow.amount;
        escrow.state = EscrowState.COMPLETED;
        escrow.completedAt = block.timestamp;

        // --- Interactions (ETH transfer) ---
        (bool success, ) = escrow.freelancer.call{value: payment}("");
        require(success, "Payment transfer to freelancer failed");

        emit PaymentReleased(_escrowId, escrow.freelancer, payment);
    }

    /**
     * @notice Client cancels the escrow and receives a full refund.
     *         Only allowed before the freelancer starts working.
     * @param _escrowId  The ID of the escrow.
     *
     * @dev
     * - State: FUNDED → CANCELLED (then refunded).
     * - Cannot cancel once work is IN_PROGRESS or later.
     */
    function cancelAndRefund(uint256 _escrowId)
        external
        nonReentrant
        onlyClient(_escrowId)
        inState(_escrowId, EscrowState.FUNDED)
    {
        Escrow storage escrow = escrows[_escrowId];

        // --- Effects ---
        uint256 refundAmount = escrow.amount;
        escrow.state = EscrowState.CANCELLED;
        escrow.completedAt = block.timestamp;

        // --- Interactions ---
        (bool success, ) = escrow.client.call{value: refundAmount}("");
        require(success, "Refund transfer to client failed");

        emit RefundIssued(_escrowId, escrow.client, refundAmount);
    }

    /**
     * @notice Either client or freelancer raises a dispute.
     * @param _escrowId  The ID of the escrow.
     *
     * @dev
     * - Allowed when state is IN_PROGRESS or SUBMITTED.
     * - State → DISPUTED.
     */
    function raiseDispute(uint256 _escrowId) external {
        Escrow storage escrow = escrows[_escrowId];

        // --- Checks ---
        require(
            msg.sender == escrow.client || msg.sender == escrow.freelancer,
            "Only client or freelancer can raise a dispute"
        );
        require(
            escrow.state == EscrowState.IN_PROGRESS ||
            escrow.state == EscrowState.SUBMITTED,
            "Dispute can only be raised during work or after submission"
        );

        // --- Effects ---
        escrow.state = EscrowState.DISPUTED;

        // --- Interactions ---
        emit DisputeRaised(_escrowId, msg.sender);
    }

    /**
     * @notice Arbitrator resolves a dispute by awarding funds to either party.
     * @param _escrowId       The ID of the escrow.
     * @param _freelancerWins If true, freelancer gets paid; otherwise client is refunded.
     *
     * @dev
     * - State: DISPUTED → COMPLETED (if freelancer wins) or REFUNDED (if client wins).
     */
    function resolveDispute(uint256 _escrowId, bool _freelancerWins)
        external
        nonReentrant
        onlyArbitrator
        inState(_escrowId, EscrowState.DISPUTED)
    {
        Escrow storage escrow = escrows[_escrowId];

        // --- Effects ---
        uint256 amount = escrow.amount;
        escrow.completedAt = block.timestamp;

        if (_freelancerWins) {
            escrow.state = EscrowState.COMPLETED;
        } else {
            escrow.state = EscrowState.REFUNDED;
        }

        // --- Interactions ---
        address payable recipient = _freelancerWins
            ? escrow.freelancer
            : escrow.client;

        (bool success, ) = recipient.call{value: amount}("");
        require(success, "Dispute resolution transfer failed");

        emit DisputeResolved(_escrowId, _freelancerWins, msg.sender);

        if (_freelancerWins) {
            emit PaymentReleased(_escrowId, escrow.freelancer, amount);
        } else {
            emit RefundIssued(_escrowId, escrow.client, amount);
        }
    }

    // --------------------------------------------------------
    //  8. VIEW / HELPER FUNCTIONS
    // --------------------------------------------------------

    /**
     * @notice Returns full details of an escrow.
     * @param _escrowId The ID of the escrow.
     */
    function getEscrowDetails(uint256 _escrowId)
        external
        view
        returns (
            uint256 id,
            address client,
            address freelancer,
            uint256 amount,
            string memory projectTitle,
            EscrowState state,
            uint256 createdAt,
            uint256 fundedAt,
            uint256 completedAt
        )
    {
        Escrow storage escrow = escrows[_escrowId];
        return (
            escrow.id,
            escrow.client,
            escrow.freelancer,
            escrow.amount,
            escrow.projectTitle,
            escrow.state,
            escrow.createdAt,
            escrow.fundedAt,
            escrow.completedAt
        );
    }

    /**
     * @notice Returns the current ETH balance held by this contract.
     * @return The balance in wei.
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @notice Returns the total number of escrows created.
     * @return The escrow count.
     */
    function getEscrowCount() external view returns (uint256) {
        return escrowCount;
    }
}
