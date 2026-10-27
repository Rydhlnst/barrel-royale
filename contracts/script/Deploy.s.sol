// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Script, console2} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {XOMRewardVault} from "../src/XOMRewardVault.sol";
import {RigNFT} from "../src/RigNFT.sol";
import {FeeSplitter} from "../src/FeeSplitter.sol";

/// Deploys the vault, the rig NFT and the fee splitter, all owned by OWNER (the treasury multisig).
/// Every address and amount comes from the environment, see contracts/.env.example.
contract Deploy is Script {
    function run() external {
        address owner = vm.envAddress("OWNER");
        IERC20 xom = IERC20(vm.envAddress("XOM"));
        address payable treasury = payable(vm.envAddress("TREASURY"));

        XOMRewardVault.ExportRules memory rules = XOMRewardVault.ExportRules({
            barrels: uint32(vm.envOr("EXPORT_BARRELS", uint256(300))),
            usdMicros: uint32(vm.envOr("EXPORT_USD_MICROS", uint256(1_000))),
            dailyQuota: uint32(vm.envOr("EXPORT_DAILY_QUOTA", uint256(5_000)))
        });

        FeeSplitter.Config memory split = FeeSplitter.Config({
            costs: payable(vm.envAddress("PAYEE_COSTS")),
            reserve: payable(vm.envAddress("PAYEE_RESERVE")),
            xomBuyer: payable(vm.envAddress("PAYEE_XOM_BUYER")),
            dev: payable(vm.envAddress("PAYEE_DEV")),
            buyback: payable(vm.envAddress("PAYEE_BUYBACK")),
            prizes: payable(vm.envAddress("PAYEE_PRIZES")),
            costCap: vm.envUint("COST_CAP_WEI"),
            reserveTarget: vm.envUint("RESERVE_TARGET_WEI")
        });

        vm.startBroadcast();
        XOMRewardVault vault = new XOMRewardVault(xom, owner, rules);
        RigNFT rig = new RigNFT(owner, treasury, vm.envString("RIG_BASE_URI"));
        FeeSplitter splitter = new FeeSplitter(owner, split);
        vm.stopBroadcast();

        console2.log("XOMRewardVault", address(vault));
        console2.log("RigNFT        ", address(rig));
        console2.log("FeeSplitter   ", address(splitter));
    }
}
