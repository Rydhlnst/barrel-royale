# Barrel Royale contracts

Solidity 0.8.26, Foundry, OpenZeppelin 5.1. Every contract is owned by the treasury multisig and none can be renounced.

| Contract | What it does |
| --- | --- |
| `XOMRewardVault` | Holds XOM. Keeps rewards owed to players apart from the free balance. Players claim weekly Merkle rounds; the owner withdraws from the free balance only after a 7-day timelock and at most 20% per 30 days. Stores the export rate and daily quota, which change through the same timelock. |
| `RigNFT` | The 3,333 rigs. Phased mint (OG, Crew, public) with Merkle lists, at most 5 per transaction. The class seed hash is committed before the first mint and revealed after the mint ends. |
| `RigUpgrader` | Raises a rig's class by burning $ROYAL: 2,000 for Semi-sub, 5,000 for Drillship, 12,000 for Ultra-deepwater, counted from Jack-up, so holders pay only the difference. No owner; costs are fixed at deploy. |
| `FeeSplitter` | Pays creator fees out in three steps: running costs up to a cap per 30 days, the reserve up to a target, then 40% XOM, 35% development, 20% $ROYAL buyback and burn, 5% prizes. Shares are fixed; payees and caps change through a 7-day timelock. |

$ROYAL itself is created by the launchpad.

## Build and test

```bash
forge install foundry-rs/forge-std OpenZeppelin/openzeppelin-contracts@v5.1.0 --no-git
forge build
forge test
```

## Deploy to Robinhood Chain mainnet

1. Copy `.env.example` to `.env` and fill it in. `OWNER` should be the treasury multisig.
2. Import the deployer wallet into Foundry's encrypted keystore (it asks for the private key in your terminal, never in a file):

   ```bash
   cast wallet import barrel-deployer --interactive
   ```

3. Dry-run against a mainnet fork, then broadcast:

   ```bash
   source .env
   forge script script/Deploy.s.sol --rpc-url robinhood --account barrel-deployer
   forge script script/Deploy.s.sol --rpc-url robinhood --account barrel-deployer --broadcast
   ```

The whole deploy uses about 7.7M gas.

## Once $ROYAL is live

```bash
forge script script/DeployUpgrader.s.sol --rpc-url robinhood --account barrel-deployer --broadcast
```

Then the multisig calls `RigNFT.setUpgrader(<RigUpgrader address>)`. It can be set only once.

## After deploying

- Send a small amount of XOM to the vault and claim it back through a one-wallet test round before funding it, to confirm XOM moves to and from the contract.
- On `RigNFT`: `setPrice`, `setLists`, `commitSeed`, then `setPhase` to open the mint. Keep the seed secret until `reveal`.
- Point the launchpad's creator fees at the `FeeSplitter` address, or forward them there.
- Publish every address in the docs and on X.
