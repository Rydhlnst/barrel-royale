// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Test} from "forge-std/Test.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {RigNFT} from "../src/RigNFT.sol";
import {RigUpgrader} from "../src/RigUpgrader.sol";

contract MockRoyal is ERC20 {
    constructor() ERC20("Royal", "ROYAL") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract RigUpgraderTest is Test {
    RigNFT rig;
    RigUpgrader upgrader;
    MockRoyal royal;
    address owner = makeAddr("multisig");
    address holder = makeAddr("holder");
    address other = makeAddr("other");
    address constant DEAD = 0x000000000000000000000000000000000000dEaD;

    bytes32 constant SEED = keccak256("seed");
    uint256 constant PRICE = 0.0001 ether;

    function setUp() public {
        royal = new MockRoyal();
        rig = new RigNFT(owner, payable(makeAddr("treasury")), "");
        upgrader = new RigUpgrader(IERC20(address(royal)), rig, 2_000 ether, 5_000 ether, 12_000 ether);

        vm.startPrank(owner);
        rig.setPrice(PRICE);
        rig.commitSeed(keccak256(abi.encode(SEED)));
        rig.setPhase(RigNFT.Phase.Public);
        vm.stopPrank();

        vm.deal(holder, 1 ether);
        vm.prank(holder);
        rig.mint{value: PRICE * 3}(3, new bytes32[](0));

        vm.startPrank(owner);
        rig.setPhase(RigNFT.Phase.Ended);
        rig.reveal(SEED);
        rig.setUpgrader(address(upgrader));
        vm.stopPrank();

        royal.mint(holder, 100_000 ether);
        vm.prank(holder);
        royal.approve(address(upgrader), type(uint256).max);
    }

    function test_upgradeBurnsTheDifference() public {
        RigNFT.Class from = rig.classOf(1);
        vm.assume(from != RigNFT.Class.UltraDeepwater);
        RigNFT.Class to = RigNFT.Class(uint8(from) + 1);
        uint256 expected = upgrader.costOf(to) - upgrader.costOf(from);
        assertEq(upgrader.quote(1, to), expected);

        vm.prank(holder);
        upgrader.upgrade(1, to);
        assertEq(uint8(rig.classOf(1)), uint8(to));
        assertEq(uint8(rig.drawnClassOf(1)), uint8(from));
        assertEq(royal.balanceOf(DEAD), expected);

        // straight to the top: pays only what is left
        if (to != RigNFT.Class.UltraDeepwater) {
            vm.prank(holder);
            upgrader.upgrade(1, RigNFT.Class.UltraDeepwater);
            assertEq(royal.balanceOf(DEAD), 12_000 ether - upgrader.costOf(from));
        }
    }

    function test_onlyTheHolderUpgrades() public {
        vm.prank(other);
        vm.expectRevert(RigUpgrader.NotHolder.selector);
        upgrader.upgrade(1, RigNFT.Class.UltraDeepwater);
    }

    function test_cannotGoDownOrSideways() public {
        RigNFT.Class from = rig.classOf(1);
        vm.prank(holder);
        vm.expectRevert();
        upgrader.upgrade(1, from);
    }

    function test_onlyUpgraderRaisesClasses() public {
        vm.prank(owner);
        vm.expectRevert(RigNFT.NotUpgrader.selector);
        rig.raiseClass(1, RigNFT.Class.UltraDeepwater);
    }

    function test_upgraderIsSetOnce() public {
        vm.prank(owner);
        vm.expectRevert(RigNFT.UpgraderLocked.selector);
        rig.setUpgrader(other);
    }

    function test_costsMustRise() public {
        vm.expectRevert(RigUpgrader.BadCosts.selector);
        new RigUpgrader(IERC20(address(royal)), rig, 5_000 ether, 2_000 ether, 12_000 ether);
    }
}
