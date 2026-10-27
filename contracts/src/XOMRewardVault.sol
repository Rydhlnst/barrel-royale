// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/// @title XOMRewardVault
/// @notice Holds the XOM that Barrel Royale players earn by exporting barrels.
///
/// The vault keeps two balances apart:
/// - XOM owed to players: every posted weekly round that is not yet claimed or expired. It can only
///   leave through players' claims. No admin function can move it.
/// - The free balance: everything else. The owner (the treasury multisig) can withdraw it only after
///   a 7-day timelock, and at most 20% of it in any 30 days.
///
/// The owner posts one Merkle root per week. A round can take at most 10% of the free balance, rounds
/// are at least 6 days apart, and claims open 2 days after posting so the published list can be checked.
/// The export rules the game server applies are stored here and change through the same timelock.
contract XOMRewardVault is Ownable2Step, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 public constant TIMELOCK = 7 days;
    uint256 public constant WITHDRAW_WINDOW = 30 days;
    uint256 public constant WITHDRAW_BPS = 2_000;
    uint256 public constant ROUND_BPS = 1_000;
    uint256 public constant ROUND_SPACING = 6 days;
    uint256 public constant CLAIM_DELAY = 2 days;
    uint256 public constant CLAIM_PERIOD = 12 weeks;
    uint256 public constant MAX_PAUSE = 14 days;
    uint256 public constant PAUSE_COOLDOWN = 14 days;
    uint256 private constant BPS = 10_000;

    IERC20 public immutable xom;

    struct Round {
        bytes32 root;
        uint128 total;
        uint128 claimed;
        uint64 postedAt;
        uint64 pausedAtPost;
        bool closed;
    }

    /// @notice How the game turns barrels into XOM: `barrels` exported earn `usdMicros` millionths of a
    /// dollar of XOM, up to `dailyQuota` barrels per rig per day.
    struct ExportRules {
        uint32 barrels;
        uint32 usdMicros;
        uint32 dailyQuota;
    }

    struct Withdrawal {
        address to;
        uint128 amount;
        uint64 eta;
        bool done;
        bool cancelled;
    }

    mapping(uint256 week => Round) public rounds;
    mapping(uint256 week => mapping(address account => bool)) public hasClaimed;
    /// @notice XOM owed to players across every open round.
    uint256 public owed;
    uint256 public lastPostedAt;

    ExportRules public rules;
    ExportRules public pendingRules;
    uint256 public pendingRulesEta;

    Withdrawal[] public withdrawals;
    uint256 public windowStart;
    uint256 public windowBase;
    uint256 public windowUsed;

    uint256 public pausedAt;
    uint256 public pausedUntil;
    uint256 public pausedTotal;
    uint256 public nextPauseAllowed;

    event RoundPosted(uint256 indexed week, bytes32 root, uint256 total);
    event Claimed(uint256 indexed week, address indexed account, uint256 amount);
    event RoundExpired(uint256 indexed week, uint256 returned);
    event WithdrawalScheduled(uint256 indexed id, address indexed to, uint256 amount, uint256 eta);
    event WithdrawalCancelled(uint256 indexed id);
    event WithdrawalExecuted(uint256 indexed id, address indexed to, uint256 amount);
    event RulesScheduled(uint32 barrels, uint32 usdMicros, uint32 dailyQuota, uint256 eta);
    event RulesCancelled();
    event RulesApplied(uint32 barrels, uint32 usdMicros, uint32 dailyQuota);
    event Paused(uint256 until);
    event Unpaused(uint256 pausedFor);

    error InvalidRound();
    error RoundTooLarge();
    error RoundTooSoon();
    error ClaimsClosed();
    error ClaimsNotOpen();
    error AlreadyClaimed();
    error InvalidProof();
    error NotExpired();
    error ClaimsPaused();
    error PauseNotAllowed();
    error NotPaused();
    error TooEarly();
    error UnknownWithdrawal();
    error OverLimit();
    error InvalidRules();
    error NoPendingRules();
    error CannotRescueXom();
    error RenounceDisabled();

    constructor(IERC20 xom_, address owner_, ExportRules memory rules_) Ownable(owner_) {
        if (rules_.barrels == 0 || rules_.usdMicros == 0) revert InvalidRules();
        xom = xom_;
        rules = rules_;
        emit RulesApplied(rules_.barrels, rules_.usdMicros, rules_.dailyQuota);
    }

    /* ---------------- balances ---------------- */

    /// @notice XOM that no player has been assigned yet.
    function freeBalance() public view returns (uint256) {
        uint256 bal = xom.balanceOf(address(this));
        return bal > owed ? bal - owed : 0;
    }

    /* ---------------- rounds and claims ---------------- */

    /// @notice Post a week's rewards. The full list of wallets and amounts is published alongside it.
    function postRound(uint256 week, bytes32 root, uint128 total) external onlyOwner {
        if (root == bytes32(0) || total == 0 || rounds[week].root != bytes32(0)) revert InvalidRound();
        if (lastPostedAt != 0 && block.timestamp < lastPostedAt + ROUND_SPACING) revert RoundTooSoon();
        if (total > (freeBalance() * ROUND_BPS) / BPS) revert RoundTooLarge();
        rounds[week] = Round({
            root: root,
            total: total,
            claimed: 0,
            postedAt: uint64(block.timestamp),
            pausedAtPost: uint64(totalPaused()),
            closed: false
        });
        owed += total;
        lastPostedAt = block.timestamp;
        emit RoundPosted(week, root, total);
    }

    /// @notice When claims for a week open.
    function claimOpensAt(uint256 week) public view returns (uint256) {
        return rounds[week].postedAt + CLAIM_DELAY;
    }

    /// @notice When claims for a week close. Time spent paused is added on top.
    function claimDeadline(uint256 week) public view returns (uint256) {
        Round storage r = rounds[week];
        return r.postedAt + CLAIM_DELAY + CLAIM_PERIOD + (totalPaused() - r.pausedAtPost);
    }

    function claim(uint256 week, uint256 amount, bytes32[] calldata proof) external nonReentrant {
        if (isPaused()) revert ClaimsPaused();
        Round storage r = rounds[week];
        if (r.root == bytes32(0) || r.closed) revert ClaimsClosed();
        if (block.timestamp < claimOpensAt(week)) revert ClaimsNotOpen();
        if (block.timestamp > claimDeadline(week)) revert ClaimsClosed();
        if (hasClaimed[week][msg.sender]) revert AlreadyClaimed();
        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(msg.sender, amount))));
        if (!MerkleProof.verifyCalldata(proof, r.root, leaf)) revert InvalidProof();
        if (r.claimed + amount > r.total) revert InvalidProof();

        hasClaimed[week][msg.sender] = true;
        r.claimed += uint128(amount);
        owed -= amount;
        xom.safeTransfer(msg.sender, amount);
        emit Claimed(week, msg.sender, amount);
    }

    /// @notice After a round's deadline, return what nobody claimed to the free balance. Anyone can call it.
    function expire(uint256 week) external {
        Round storage r = rounds[week];
        if (r.root == bytes32(0) || r.closed) revert ClaimsClosed();
        if (block.timestamp <= claimDeadline(week)) revert NotExpired();
        r.closed = true;
        uint256 left = r.total - r.claimed;
        owed -= left;
        emit RoundExpired(week, left);
    }

    /* ---------------- treasury withdrawals ---------------- */

    function withdrawalCount() external view returns (uint256) {
        return withdrawals.length;
    }

    /// @notice Announce a withdrawal from the free balance. It can be executed after the timelock.
    function scheduleWithdrawal(address to, uint128 amount) external onlyOwner returns (uint256 id) {
        if (to == address(0) || amount == 0) revert OverLimit();
        id = withdrawals.length;
        uint64 eta = uint64(block.timestamp + TIMELOCK);
        withdrawals.push(Withdrawal({to: to, amount: amount, eta: eta, done: false, cancelled: false}));
        emit WithdrawalScheduled(id, to, amount, eta);
    }

    function cancelWithdrawal(uint256 id) external onlyOwner {
        if (id >= withdrawals.length) revert UnknownWithdrawal();
        Withdrawal storage w = withdrawals[id];
        if (w.done || w.cancelled) revert UnknownWithdrawal();
        w.cancelled = true;
        emit WithdrawalCancelled(id);
    }

    /// @notice Execute a scheduled withdrawal: only from the free balance, at most 20% of it per 30 days.
    function executeWithdrawal(uint256 id) external onlyOwner nonReentrant {
        if (id >= withdrawals.length) revert UnknownWithdrawal();
        Withdrawal storage w = withdrawals[id];
        if (w.done || w.cancelled) revert UnknownWithdrawal();
        if (block.timestamp < w.eta) revert TooEarly();

        if (windowStart == 0 || block.timestamp >= windowStart + WITHDRAW_WINDOW) {
            windowStart = block.timestamp;
            windowBase = freeBalance();
            windowUsed = 0;
        }
        uint256 amount = w.amount;
        if (windowUsed + amount > (windowBase * WITHDRAW_BPS) / BPS || amount > freeBalance()) revert OverLimit();

        windowUsed += amount;
        w.done = true;
        xom.safeTransfer(w.to, amount);
        emit WithdrawalExecuted(id, w.to, amount);
    }

    /* ---------------- export rules ---------------- */

    function scheduleRules(ExportRules calldata next) external onlyOwner {
        if (next.barrels == 0 || next.usdMicros == 0) revert InvalidRules();
        pendingRules = next;
        pendingRulesEta = block.timestamp + TIMELOCK;
        emit RulesScheduled(next.barrels, next.usdMicros, next.dailyQuota, pendingRulesEta);
    }

    function cancelRules() external onlyOwner {
        if (pendingRulesEta == 0) revert NoPendingRules();
        delete pendingRules;
        pendingRulesEta = 0;
        emit RulesCancelled();
    }

    /// @notice Apply scheduled rules once the timelock has passed. Anyone can call it.
    function applyRules() external {
        if (pendingRulesEta == 0) revert NoPendingRules();
        if (block.timestamp < pendingRulesEta) revert TooEarly();
        rules = pendingRules;
        delete pendingRules;
        pendingRulesEta = 0;
        emit RulesApplied(rules.barrels, rules.usdMicros, rules.dailyQuota);
    }

    /* ---------------- pause ---------------- */

    function isPaused() public view returns (bool) {
        return pausedAt != 0 && block.timestamp < pausedUntil;
    }

    /// @notice Total time claims have been paused, including a pause still running.
    function totalPaused() public view returns (uint256) {
        if (pausedAt == 0) return pausedTotal;
        uint256 end = block.timestamp < pausedUntil ? block.timestamp : pausedUntil;
        return pausedTotal + (end - pausedAt);
    }

    /// @notice Pause claims for a security issue: at most 14 days, then 14 days before the next pause.
    function pause() external onlyOwner {
        _settlePause();
        if (block.timestamp < nextPauseAllowed) revert PauseNotAllowed();
        pausedAt = block.timestamp;
        pausedUntil = block.timestamp + MAX_PAUSE;
        nextPauseAllowed = pausedUntil + PAUSE_COOLDOWN;
        emit Paused(pausedUntil);
    }

    function unpause() external onlyOwner {
        if (!isPaused()) revert NotPaused();
        uint256 pausedFor = block.timestamp - pausedAt;
        pausedTotal += pausedFor;
        pausedAt = 0;
        nextPauseAllowed = block.timestamp + PAUSE_COOLDOWN;
        emit Unpaused(pausedFor);
    }

    function _settlePause() private {
        if (pausedAt != 0 && block.timestamp >= pausedUntil) {
            pausedTotal += pausedUntil - pausedAt;
            pausedAt = 0;
        }
    }

    /* ---------------- housekeeping ---------------- */

    /// @notice Return tokens other than XOM that were sent here by mistake.
    function rescue(IERC20 token, address to, uint256 amount) external onlyOwner {
        if (address(token) == address(xom)) revert CannotRescueXom();
        token.safeTransfer(to, amount);
    }

    /// @notice Ownership can be handed over but never renounced, so the vault can always be managed.
    function renounceOwnership() public pure override {
        revert RenounceDisabled();
    }
}
