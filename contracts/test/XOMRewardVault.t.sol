// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Test} from "forge-std/Test.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {XOMRewardVault} from "../src/XOMRewardVault.sol";

contract MockToken is ERC20 {
    constructor() ERC20("Mock XOM", "XOM") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract XOMRewardVaultTest is Test {
    MockToken xom;
    XOMRewardVault vault;
    address owner = makeAddr("multisig");
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    address stranger = makeAddr("stranger");

    uint256 constant FUNDED = 1_000 ether;

    function setUp() public {
        vm.warp(1_800_000_000);
        xom = new MockToken();
        vault = new XOMRewardVault(IERC20(address(xom)), owner, XOMRewardVault.ExportRules(300, 1_000, 5_000));
        xom.mint(address(vault), FUNDED);
    }

    /* ---------------- helpers ---------------- */

    function leaf(address account, uint256 amount) internal pure returns (bytes32) {
        return keccak256(bytes.concat(keccak256(abi.encode(account, amount))));
    }

    function pair(bytes32 a, bytes32 b) internal pure returns (bytes32) {
        return a < b ? keccak256(abi.encode(a, b)) : keccak256(abi.encode(b, a));
    }

    /// A two-wallet round: alice and bob, with each one's proof.
    function postTwo(uint256 week, uint256 a, uint256 b) internal returns (bytes32[] memory pa, bytes32[] memory pb) {
        bytes32 la = leaf(alice, a);
        bytes32 lb = leaf(bob, b);
        vm.prank(owner);
        vault.postRound(week, pair(la, lb), uint128(a + b));
        pa = new bytes32[](1);
        pa[0] = lb;
        pb = new bytes32[](1);
        pb[0] = la;
    }

    /* ---------------- rounds and claims ---------------- */

    function test_claimAfterDelay() public {
        (bytes32[] memory pa,) = postTwo(1, 30 ether, 20 ether);
        assertEq(vault.owed(), 50 ether);
        assertEq(vault.freeBalance(), FUNDED - 50 ether);

        vm.prank(alice);
        vm.expectRevert(XOMRewardVault.ClaimsNotOpen.selector);
        vault.claim(1, 30 ether, pa);

        vm.warp(block.timestamp + 2 days);
        vm.prank(alice);
        vault.claim(1, 30 ether, pa);
        assertEq(xom.balanceOf(alice), 30 ether);
        assertEq(vault.owed(), 20 ether);

        vm.prank(alice);
        vm.expectRevert(XOMRewardVault.AlreadyClaimed.selector);
        vault.claim(1, 30 ether, pa);
    }

    function test_wrongAmountOrWalletFails() public {
        (bytes32[] memory pa,) = postTwo(1, 30 ether, 20 ether);
        vm.warp(block.timestamp + 2 days);
        vm.prank(alice);
        vm.expectRevert(XOMRewardVault.InvalidProof.selector);
        vault.claim(1, 31 ether, pa);
        vm.prank(stranger);
        vm.expectRevert(XOMRewardVault.InvalidProof.selector);
        vault.claim(1, 30 ether, pa);
    }

    function test_roundLimits() public {
        vm.startPrank(owner);
        vm.expectRevert(XOMRewardVault.RoundTooLarge.selector);
        vault.postRound(1, bytes32(uint256(1)), uint128(FUNDED / 10 + 1));
        vault.postRound(1, bytes32(uint256(1)), uint128(FUNDED / 10));
        vm.expectRevert(XOMRewardVault.RoundTooSoon.selector);
        vault.postRound(2, bytes32(uint256(2)), 1 ether);
        vm.warp(block.timestamp + 6 days);
        vault.postRound(2, bytes32(uint256(2)), 1 ether);
        vm.expectRevert(XOMRewardVault.InvalidRound.selector);
        vault.postRound(2, bytes32(uint256(3)), 1 ether);
        vm.stopPrank();
    }

    function test_onlyOwnerPostsRounds() public {
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, stranger));
        vault.postRound(1, bytes32(uint256(1)), 1 ether);
    }

    function test_expireReturnsUnclaimed() public {
        (bytes32[] memory pa,) = postTwo(1, 30 ether, 20 ether);
        vm.warp(block.timestamp + 2 days);
        vm.prank(alice);
        vault.claim(1, 30 ether, pa);

        vm.expectRevert(XOMRewardVault.NotExpired.selector);
        vault.expire(1);

        vm.warp(block.timestamp + 12 weeks + 1);
        vm.prank(stranger);
        vault.expire(1);
        assertEq(vault.owed(), 0);
        assertEq(vault.freeBalance(), FUNDED - 30 ether);
    }

    /* ---------------- owed XOM is out of the owner's reach ---------------- */

    function test_ownerCannotWithdrawOwed() public {
        // fill owed with a 10% round, then try to withdraw more than the free balance allows
        vm.prank(owner);
        vault.postRound(1, bytes32(uint256(1)), uint128(FUNDED / 10));
        uint256 free = vault.freeBalance();
        assertEq(free, FUNDED - FUNDED / 10);

        vm.prank(owner);
        uint256 id = vault.scheduleWithdrawal(owner, uint128(FUNDED));
        vm.warp(block.timestamp + 7 days);
        vm.prank(owner);
        vm.expectRevert(XOMRewardVault.OverLimit.selector);
        vault.executeWithdrawal(id);
        assertEq(xom.balanceOf(address(vault)), FUNDED);
    }

    function test_rescueCannotTouchXom() public {
        vm.prank(owner);
        vm.expectRevert(XOMRewardVault.CannotRescueXom.selector);
        vault.rescue(IERC20(address(xom)), owner, 1 ether);
    }

    /* ---------------- withdrawals: timelock and 20% per 30 days ---------------- */

    function test_withdrawWaitsForTimelock() public {
        vm.prank(owner);
        uint256 id = vault.scheduleWithdrawal(owner, 100 ether);
        vm.warp(block.timestamp + 7 days - 1);
        vm.prank(owner);
        vm.expectRevert(XOMRewardVault.TooEarly.selector);
        vault.executeWithdrawal(id);
        vm.warp(block.timestamp + 1);
        vm.prank(owner);
        vault.executeWithdrawal(id);
        assertEq(xom.balanceOf(owner), 100 ether);
    }

    function test_withdrawCappedAt20PercentPerWindow() public {
        vm.startPrank(owner);
        uint256 a = vault.scheduleWithdrawal(owner, 150 ether);
        uint256 b = vault.scheduleWithdrawal(owner, 50 ether);
        uint256 c = vault.scheduleWithdrawal(owner, 1 ether);
        vm.warp(block.timestamp + 7 days);
        vault.executeWithdrawal(a);
        vault.executeWithdrawal(b); // 200 = 20% of 1,000
        vm.expectRevert(XOMRewardVault.OverLimit.selector);
        vault.executeWithdrawal(c);
        vm.warp(block.timestamp + 30 days);
        vault.executeWithdrawal(c); // a new window
        vm.stopPrank();
        assertEq(xom.balanceOf(owner), 201 ether);
    }

    function test_cancelledWithdrawalCannotRun() public {
        vm.startPrank(owner);
        uint256 id = vault.scheduleWithdrawal(owner, 10 ether);
        vault.cancelWithdrawal(id);
        vm.warp(block.timestamp + 7 days);
        vm.expectRevert(XOMRewardVault.UnknownWithdrawal.selector);
        vault.executeWithdrawal(id);
        vm.stopPrank();
    }

    function test_onlyOwnerWithdraws() public {
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, stranger));
        vault.scheduleWithdrawal(stranger, 1 ether);
    }

    /* ---------------- export rules ---------------- */

    function test_rulesChangeThroughTimelock() public {
        vm.prank(owner);
        vault.scheduleRules(XOMRewardVault.ExportRules(600, 1_000, 4_000));
        vm.expectRevert(XOMRewardVault.TooEarly.selector);
        vault.applyRules();
        vm.warp(block.timestamp + 7 days);
        vm.prank(stranger);
        vault.applyRules();
        (uint32 barrels, uint32 usdMicros, uint32 quota) = vault.rules();
        assertEq(barrels, 600);
        assertEq(usdMicros, 1_000);
        assertEq(quota, 4_000);
    }

    /* ---------------- pause ---------------- */

    function test_pauseBlocksClaimsAndExtendsDeadline() public {
        (bytes32[] memory pa,) = postTwo(1, 30 ether, 20 ether);
        uint256 before = vault.claimDeadline(1);
        vm.warp(block.timestamp + 2 days);

        vm.prank(owner);
        vault.pause();
        vm.prank(alice);
        vm.expectRevert(XOMRewardVault.ClaimsPaused.selector);
        vault.claim(1, 30 ether, pa);

        vm.warp(block.timestamp + 5 days);
        vm.prank(owner);
        vault.unpause();
        assertEq(vault.claimDeadline(1), before + 5 days);

        vm.prank(alice);
        vault.claim(1, 30 ether, pa);
    }

    function test_pauseEndsByItselfAfter14Days() public {
        vm.prank(owner);
        vault.pause();
        vm.warp(block.timestamp + 14 days);
        assertFalse(vault.isPaused());
        assertEq(vault.totalPaused(), 14 days);

        vm.prank(owner);
        vm.expectRevert(XOMRewardVault.PauseNotAllowed.selector);
        vault.pause();
        vm.warp(block.timestamp + 14 days);
        vm.prank(owner);
        vault.pause();
    }

    function test_cannotRenounce() public {
        vm.prank(owner);
        vm.expectRevert(XOMRewardVault.RenounceDisabled.selector);
        vault.renounceOwnership();
    }

    /* ---------------- fuzz: the owner never takes more than the free balance allows ---------------- */

    function testFuzz_ownerTakesAtMost20PercentOfFree(uint128 roundTotal, uint128 ask) public {
        roundTotal = uint128(bound(roundTotal, 1, FUNDED / 10));
        vm.prank(owner);
        vault.postRound(1, bytes32(uint256(1)), roundTotal);
        uint256 free = vault.freeBalance();

        vm.prank(owner);
        uint256 id = vault.scheduleWithdrawal(owner, uint128(bound(ask, 1, FUNDED)));
        vm.warp(block.timestamp + 7 days);
        vm.prank(owner);
        try vault.executeWithdrawal(id) {} catch {}

        assertLe(xom.balanceOf(owner), (free * 2_000) / 10_000);
        assertGe(xom.balanceOf(address(vault)), vault.owed());
    }
}
