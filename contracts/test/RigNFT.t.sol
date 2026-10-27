// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Test} from "forge-std/Test.sol";
import {RigNFT} from "../src/RigNFT.sol";

contract RigNFTTest is Test {
    RigNFT rig;
    address owner = makeAddr("multisig");
    address payable treasury = payable(makeAddr("treasury"));
    address og = makeAddr("og");
    address crew = makeAddr("crew");
    address anyone = makeAddr("anyone");

    bytes32 constant SEED = keccak256("barrel royale class seed");
    uint256 constant PRICE = 0.0001 ether;

    function leaf(address account) internal pure returns (bytes32) {
        return keccak256(bytes.concat(keccak256(abi.encode(account))));
    }

    function setUp() public {
        rig = new RigNFT(owner, treasury, "https://barrelroyale.io/rigs/");
        vm.startPrank(owner);
        rig.setPrice(PRICE);
        // one-wallet lists: the root is the leaf itself and the proof is empty
        rig.setLists(leaf(og), leaf(crew));
        rig.commitSeed(keccak256(abi.encode(SEED)));
        vm.stopPrank();
        vm.deal(og, 10 ether);
        vm.deal(crew, 10 ether);
        vm.deal(anyone, 10 ether);
    }

    function test_phasesOpenInOrder() public {
        bytes32[] memory none = new bytes32[](0);

        vm.prank(og);
        vm.expectRevert(RigNFT.MintClosed.selector);
        rig.mint{value: PRICE}(1, none);

        vm.prank(owner);
        rig.setPhase(RigNFT.Phase.OG);
        vm.prank(og);
        rig.mint{value: PRICE * 2}(2, none);
        vm.prank(crew);
        vm.expectRevert(RigNFT.NotOnList.selector);
        rig.mint{value: PRICE}(1, none);

        vm.prank(owner);
        rig.setPhase(RigNFT.Phase.Crew);
        vm.prank(crew);
        rig.mint{value: PRICE}(1, none);

        vm.prank(owner);
        rig.setPhase(RigNFT.Phase.Public);
        vm.prank(anyone);
        rig.mint{value: PRICE * 5}(5, none);

        assertEq(rig.totalMinted(), 8);
        assertEq(rig.ownerOf(1), og);
        assertEq(rig.ownerOf(8), anyone);

        vm.prank(owner);
        vm.expectRevert(RigNFT.PhaseOrder.selector);
        rig.setPhase(RigNFT.Phase.OG);
    }

    function test_mintRules() public {
        bytes32[] memory none = new bytes32[](0);
        vm.prank(owner);
        rig.setPhase(RigNFT.Phase.Public);

        vm.startPrank(anyone);
        vm.expectRevert(RigNFT.BadQuantity.selector);
        rig.mint{value: PRICE * 6}(6, none);
        vm.expectRevert(RigNFT.WrongPayment.selector);
        rig.mint{value: PRICE}(2, none);
        rig.mint{value: PRICE}(1, none);
        vm.stopPrank();

        vm.prank(owner);
        vm.expectRevert(RigNFT.MintStarted.selector);
        rig.setPrice(1);
        vm.prank(owner);
        vm.expectRevert(RigNFT.MintStarted.selector);
        rig.commitSeed(bytes32(0));
    }

    function test_supplyCapped() public {
        bytes32[] memory none = new bytes32[](0);
        vm.prank(owner);
        rig.setPhase(RigNFT.Phase.Public);
        vm.deal(anyone, 1_000 ether);
        vm.startPrank(anyone);
        for (uint256 i; i < 666; ++i) rig.mint{value: PRICE * 5}(5, none);
        rig.mint{value: PRICE * 3}(3, none);
        assertEq(rig.totalMinted(), 3_333);
        vm.expectRevert(RigNFT.SoldOut.selector);
        rig.mint{value: PRICE}(1, none);
        vm.stopPrank();
    }

    function test_revealAndClassShares() public {
        bytes32[] memory none = new bytes32[](0);
        vm.prank(owner);
        rig.setPhase(RigNFT.Phase.Public);
        vm.deal(anyone, 1_000 ether);
        vm.startPrank(anyone);
        for (uint256 i; i < 666; ++i) rig.mint{value: PRICE * 5}(5, none);
        rig.mint{value: PRICE * 3}(3, none);
        vm.stopPrank();

        vm.prank(owner);
        vm.expectRevert(RigNFT.BadSeed.selector);
        rig.reveal(keccak256("wrong"));

        vm.roll(block.number + 5);
        vm.prank(owner);
        rig.reveal(SEED);

        uint256[4] memory count;
        for (uint256 id = 1; id <= 3_333; ++id) count[uint256(rig.classOf(id))]++;
        assertEq(count[0], 2_000);
        assertEq(count[1], 933);
        assertEq(count[2], 333);
        assertEq(count[3], 67);

        vm.prank(owner);
        vm.expectRevert(RigNFT.AlreadyRevealed.selector);
        rig.reveal(SEED);
    }

    function test_revealWaitsForTheMintToEnd() public {
        vm.prank(owner);
        rig.setPhase(RigNFT.Phase.Public);
        vm.prank(owner);
        vm.expectRevert(RigNFT.NotReady.selector);
        rig.reveal(SEED);
        vm.expectRevert(RigNFT.NotRevealed.selector);
        rig.classOf(1);
    }

    function test_proceedsGoToTreasury() public {
        bytes32[] memory none = new bytes32[](0);
        vm.prank(owner);
        rig.setPhase(RigNFT.Phase.Public);
        vm.prank(anyone);
        rig.mint{value: PRICE * 3}(3, none);
        vm.prank(anyone);
        rig.withdraw();
        assertEq(treasury.balance, PRICE * 3);
    }
}
