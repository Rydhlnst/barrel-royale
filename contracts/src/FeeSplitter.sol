// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title FeeSplitter
/// @notice Receives Barrel Royale's creator fees in ETH and pays them out in three steps:
/// 1. running costs, up to `costCap` per 30 days;
/// 2. the reserve, until the reserve wallet holds `reserveTarget`;
/// 3. everything else, split 40% to buy XOM for the reward vault, 35% to development and operations,
///    20% to buy back and burn $ROYAL, and 5% to crew war prizes.
/// The shares are fixed in the code. Payee addresses, the cost cap and the reserve target change only
/// through a 7-day timelock.
contract FeeSplitter is Ownable2Step, ReentrancyGuard {
    uint256 public constant TIMELOCK = 7 days;
    uint256 public constant COST_WINDOW = 30 days;
    uint256 public constant XOM_BPS = 4_000;
    uint256 public constant DEV_BPS = 3_500;
    uint256 public constant BURN_BPS = 2_000;
    uint256 public constant PRIZES_BPS = 500;
    uint256 private constant BPS = 10_000;

    struct Config {
        address payable costs;
        address payable reserve;
        address payable xomBuyer;
        address payable dev;
        address payable buyback;
        address payable prizes;
        uint256 costCap;
        uint256 reserveTarget;
    }

    Config public config;
    Config public pendingConfig;
    uint256 public pendingEta;

    uint256 public costWindowStart;
    uint256 public costPaid;

    event Received(address indexed from, uint256 amount);
    event Distributed(uint256 costs, uint256 reserve, uint256 xom, uint256 dev, uint256 buyback, uint256 prizes);
    event ConfigScheduled(uint256 eta);
    event ConfigCancelled();
    event ConfigApplied();

    error InvalidConfig();
    error NoPendingConfig();
    error TooEarly();
    error TransferFailed();
    error RenounceDisabled();

    constructor(address owner_, Config memory config_) Ownable(owner_) {
        _check(config_);
        config = config_;
        emit ConfigApplied();
    }

    receive() external payable {
        emit Received(msg.sender, msg.value);
    }

    /// @notice Pay out everything the splitter holds by the three steps. Anyone can call it.
    function distribute() external nonReentrant {
        Config memory c = config;
        uint256 left = address(this).balance;

        if (costWindowStart == 0 || block.timestamp >= costWindowStart + COST_WINDOW) {
            costWindowStart = block.timestamp;
            costPaid = 0;
        }
        uint256 toCosts = _min(left, c.costCap > costPaid ? c.costCap - costPaid : 0);
        costPaid += toCosts;
        left -= toCosts;

        uint256 reserveHas = c.reserve.balance;
        uint256 toReserve = _min(left, c.reserveTarget > reserveHas ? c.reserveTarget - reserveHas : 0);
        left -= toReserve;

        uint256 toXom = (left * XOM_BPS) / BPS;
        uint256 toDev = (left * DEV_BPS) / BPS;
        uint256 toBuyback = (left * BURN_BPS) / BPS;
        uint256 toPrizes = left - toXom - toDev - toBuyback;

        _send(c.costs, toCosts);
        _send(c.reserve, toReserve);
        _send(c.xomBuyer, toXom);
        _send(c.dev, toDev);
        _send(c.buyback, toBuyback);
        _send(c.prizes, toPrizes);
        emit Distributed(toCosts, toReserve, toXom, toDev, toBuyback, toPrizes);
    }

    function scheduleConfig(Config calldata next) external onlyOwner {
        _check(next);
        pendingConfig = next;
        pendingEta = block.timestamp + TIMELOCK;
        emit ConfigScheduled(pendingEta);
    }

    function cancelConfig() external onlyOwner {
        if (pendingEta == 0) revert NoPendingConfig();
        delete pendingConfig;
        pendingEta = 0;
        emit ConfigCancelled();
    }

    /// @notice Apply a scheduled config once the timelock has passed. Anyone can call it.
    function applyConfig() external {
        if (pendingEta == 0) revert NoPendingConfig();
        if (block.timestamp < pendingEta) revert TooEarly();
        config = pendingConfig;
        delete pendingConfig;
        pendingEta = 0;
        emit ConfigApplied();
    }

    function renounceOwnership() public pure override {
        revert RenounceDisabled();
    }

    function _check(Config memory c) private pure {
        if (
            c.costs == address(0) || c.reserve == address(0) || c.xomBuyer == address(0) || c.dev == address(0)
                || c.buyback == address(0) || c.prizes == address(0)
        ) revert InvalidConfig();
    }

    function _send(address payable to, uint256 amount) private {
        if (amount == 0) return;
        (bool ok,) = to.call{value: amount}("");
        if (!ok) revert TransferFailed();
    }

    function _min(uint256 a, uint256 b) private pure returns (uint256) {
        return a < b ? a : b;
    }
}
