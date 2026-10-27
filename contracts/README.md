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

## Deploy from the browser

`node launch.mjs ui` (or double-click `Launch Barrel Royale.cmd` on Windows) serves `launcher.html` at http://127.0.0.1:8790 and opens it. The page deploys with a browser wallet (MetaMask, Rabby), creates the class seed, verifies sources and writes every Safe batch to `deployments/`. `launcher.html` and the `.cmd` file live on the launch machine only and are not in git.

## Deploy with the launcher

`launch.mjs` runs the whole deploy from the terminal. It needs Node 18+ and Foundry.

```bash
cd contracts
node launch.mjs check       # settings, tests, chain, Safe, XOM and balance checks, plus a mainnet dry run
node launch.mjs             # the same checks, then deploys XOMRewardVault, RigNFT and FeeSplitter
```

What it does, in order:

1. **Settings.** Asks for the Safe (owner of every contract), the deployer, the payees and the export rules, and saves them to `.env`. Press Enter to keep the value shown; the Safe and deployer are filled in already.
2. **Tools and tests.** Installs the libraries if needed and runs the full test suite.
3. **Chain checks.** Confirms chain 4663, reads the Safe's signers and threshold, the XOM token and the deployer's ETH.
4. **Dry run.** Simulates the deploy against mainnet and shows the addresses and the cost.
5. **Deployer key.** Uses the Foundry keystore `barrel-deployer`. The first time, `cast` asks for the private key and a password in your terminal and keeps it encrypted in `~/.foundry/keystores`.
6. **Class seed.** Creates the secret rig class seed in `deployments/rig-seed.secret.json` (not in git; back it up) and shows its public hash.
7. **Broadcast.** After you type `deploy`, forge asks for the keystore password and sends the transactions, then verifies the sources on the explorer.
8. **Safe batch.** Writes `deployments/robinhood.json` with every address, and `deployments/safe-1-mint-setup.json` with the price and seed commit for the Safe.

### Admin actions after the deploy

Every admin step is a Safe Transaction Builder batch. At app.safe.global open the Safe, then Apps → Transaction Builder, drag in the file and sign.

```bash
node launch.mjs phase og       # then crew, public and ended as the mint moves on
node launch.mjs reveal         # after the mint ends: reveals the class seed
node launch.mjs upgrader       # once $ROYAL is live: deploys RigUpgrader and writes the setUpgrader batch
```

### Rehearsal on a fork

```bash
anvil --fork-url https://rpc.mainnet.chain.robinhood.com --port 8547
LAUNCH_RPC=http://127.0.0.1:8547 node launch.mjs
```

With `LAUNCH_RPC` set, the deployer is impersonated on the fork, no keystore is needed, and every file goes to `deployments/rehearsal/`.

The whole deploy uses about 7.9M gas, around 0.0003 ETH.

## After deploying

- Send XOM to the vault through the XOM buyer wallet. A rehearsal on a mainnet fork already moved real XOM into the vault and claimed it back out.
- On `RigNFT`, the whitelist roots go in with `setLists` after the snapshot, before the OG phase opens.
- Point the launchpad's creator fees at the `FeeSplitter` address, or forward them there.
- Publish every address in the docs and on X.
