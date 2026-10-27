// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {RigNFT} from "./RigNFT.sol";

/// @title RigUpgrader
/// @notice Raises a rig's class by burning $ROYAL. The holder pays only the difference between the cost of
/// the class the rig has and the class it moves to, and the $ROYAL goes to the dead address for good.
/// The costs are fixed at deploy and the contract has no owner.
contract RigUpgrader is ReentrancyGuard {
    using SafeERC20 for IERC20;

    address public constant BURN = 0x000000000000000000000000000000000000dEaD;

    IERC20 public immutable royal;
    RigNFT public immutable rig;
    /// @notice Cumulative $ROYAL cost of each class from Jack-up: Semi-sub, Drillship, Ultra-deepwater.
    uint256 public immutable semiSubCost;
    uint256 public immutable drillshipCost;
    uint256 public immutable ultraCost;

    event Upgraded(uint256 indexed tokenId, address indexed holder, RigNFT.Class from, RigNFT.Class to, uint256 burned);

    error NotHolder();
    error BadCosts();

    constructor(IERC20 royal_, RigNFT rig_, uint256 semiSub, uint256 drillship, uint256 ultra) {
        if (semiSub == 0 || drillship <= semiSub || ultra <= drillship) revert BadCosts();
        royal = royal_;
        rig = rig_;
        semiSubCost = semiSub;
        drillshipCost = drillship;
        ultraCost = ultra;
    }

    function costOf(RigNFT.Class class) public view returns (uint256) {
        if (class == RigNFT.Class.SemiSub) return semiSubCost;
        if (class == RigNFT.Class.Drillship) return drillshipCost;
        if (class == RigNFT.Class.UltraDeepwater) return ultraCost;
        return 0;
    }

    /// @notice What it costs to take a rig from its current class to `to`.
    function quote(uint256 tokenId, RigNFT.Class to) external view returns (uint256) {
        RigNFT.Class from = rig.classOf(tokenId);
        return to > from ? costOf(to) - costOf(from) : 0;
    }

    function upgrade(uint256 tokenId, RigNFT.Class to) external nonReentrant {
        if (rig.ownerOf(tokenId) != msg.sender) revert NotHolder();
        RigNFT.Class from = rig.classOf(tokenId);
        uint256 cost = costOf(to) - costOf(from); // reverts if `to` is not higher
        rig.raiseClass(tokenId, to);
        royal.safeTransferFrom(msg.sender, BURN, cost);
        emit Upgraded(tokenId, msg.sender, from, to, cost);
    }
}
