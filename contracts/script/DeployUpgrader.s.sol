// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Script, console2} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {RigNFT} from "../src/RigNFT.sol";
import {RigUpgrader} from "../src/RigUpgrader.sol";

/// Deploys RigUpgrader once $ROYAL is live. Afterwards the multisig calls RigNFT.setUpgrader(upgrader) once.
contract DeployUpgrader is Script {
    function run() external {
        IERC20 royal = IERC20(vm.envAddress("ROYAL"));
        RigNFT rig = RigNFT(vm.envAddress("RIG"));
        uint256 unit = 10 ** uint256(vm.envOr("ROYAL_DECIMALS", uint256(18)));

        vm.startBroadcast();
        RigUpgrader upgrader = new RigUpgrader(
            royal,
            rig,
            vm.envOr("UPGRADE_SEMISUB", uint256(2_000)) * unit,
            vm.envOr("UPGRADE_DRILLSHIP", uint256(5_000)) * unit,
            vm.envOr("UPGRADE_ULTRA", uint256(12_000)) * unit
        );
        vm.stopBroadcast();

        console2.log("RigUpgrader", address(upgrader));
    }
}
