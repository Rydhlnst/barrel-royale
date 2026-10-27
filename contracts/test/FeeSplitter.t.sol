// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Test} from "forge-std/Test.sol";
import {FeeSplitter} from "../src/FeeSplitter.sol";

contract FeeSplitterTest is Test {
    FeeSplitter splitter;
    address owner = makeAddr("multisig");
    address payable costs = payable(makeAddr("costs"));
    address payable reserve = payable(makeAddr("reserve"));
    address payable xomBuyer = payable(makeAddr("xomBuyer"));
    address payable dev = payable(makeAddr("dev"));
    address payable buyback = payable(makeAddr("buyback"));
    address payable prizes = payable(makeAddr("prizes"));

    function config(uint256 costCap, uint256 reserveTarget) internal view returns (FeeSplitter.Config memory) {
        return FeeSplitter.Config(costs, reserve, xomBuyer, dev, buyback, prizes, costCap, reserveTarget);
    }

    function setUp() public {
        vm.warp(1_800_000_000);
        splitter = new FeeSplitter(owner, config(1 ether, 3 ether));
    }

    function test_waterfall() public {
        vm.deal(address(this), 14 ether);
        (bool ok,) = address(splitter).call{value: 14 ether}("");
        assertTrue(ok);
        splitter.distribute();

        assertEq(costs.balance, 1 ether);
        assertEq(reserve.balance, 3 ether);
        assertEq(xomBuyer.balance, 4 ether);
        assertEq(dev.balance, 3.5 ether);
        assertEq(buyback.balance, 2 ether);
        assertEq(prizes.balance, 0.5 ether);
        assertEq(address(splitter).balance, 0);
    }

    function test_costCapResetsEvery30Days() public {
        vm.deal(address(this), 20 ether);
        payable(address(splitter)).transfer(5 ether);
        splitter.distribute();
        assertEq(costs.balance, 1 ether);

        payable(address(splitter)).transfer(5 ether);
        splitter.distribute();
        assertEq(costs.balance, 1 ether); // same window, reserve already full

        vm.warp(block.timestamp + 30 days);
        payable(address(splitter)).transfer(5 ether);
        splitter.distribute();
        assertEq(costs.balance, 2 ether);
    }

    function test_configWaitsForTimelock() public {
        vm.prank(owner);
        splitter.scheduleConfig(config(2 ether, 3 ether));
        vm.expectRevert(FeeSplitter.TooEarly.selector);
        splitter.applyConfig();
        vm.warp(block.timestamp + 7 days);
        splitter.applyConfig();
        (,,,,,, uint256 costCap,) = splitter.config();
        assertEq(costCap, 2 ether);
    }

    function test_rejectsEmptyPayee() public {
        FeeSplitter.Config memory c = config(1 ether, 1 ether);
        c.dev = payable(address(0));
        vm.prank(owner);
        vm.expectRevert(FeeSplitter.InvalidConfig.selector);
        splitter.scheduleConfig(c);
    }

    function testFuzz_splitAddsUp(uint96 amount) public {
        vm.deal(address(this), amount);
        payable(address(splitter)).transfer(amount);
        splitter.distribute();
        uint256 paid = costs.balance + reserve.balance + xomBuyer.balance + dev.balance + buyback.balance + prizes.balance;
        assertEq(paid, amount);
    }
}
