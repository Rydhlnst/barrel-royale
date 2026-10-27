#!/usr/bin/env node
// Barrel Royale contract launcher for Robinhood Chain mainnet.
//
//   node launch.mjs            check everything, dry-run, then deploy the vault, rig NFT and fee splitter
//   node launch.mjs check      run the checks and the dry run only
//   node launch.mjs upgrader   deploy RigUpgrader once $ROYAL is live
//   node launch.mjs phase og   write a Safe batch that moves the mint to og, crew, public or ended
//   node launch.mjs reveal     write a Safe batch that reveals the rig class seed
//   node launch.mjs ui         open the browser launcher (launcher.html): deploy with a browser wallet
//
// The deployer key stays in Foundry's encrypted keystore: forge and cast ask for its password in this
// terminal. Every admin action after the deploy is written as a Safe Transaction Builder batch to
// deployments/, ready to import at app.safe.global.

import { spawn, spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";

// LAUNCH_RPC points the launcher at a local anvil fork for a rehearsal: the deployer is impersonated, no
// keystore or password is needed, nothing is verified, and every file goes to deployments/rehearsal.
const REHEARSAL = Boolean(process.env.LAUNCH_RPC);

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = join(ROOT, "deployments", ...(REHEARSAL ? ["rehearsal"] : []));
const ENV_FILE = join(ROOT, ".env");
const DEPLOYMENT = join(OUT, "robinhood.json");
const SEED_FILE = join(OUT, "rig-seed.secret.json");

const CHAIN_ID = 4663;
const RPC = process.env.LAUNCH_RPC || "https://rpc.mainnet.chain.robinhood.com";
const EXPLORER = "https://robinhoodchain.blockscout.com";
const DEFAULTS = {
  OWNER: "0x78D3C3eCA876A5b08bb56C8cE50907dDF21b1A15",
  DEPLOYER: "0x8F3EbbD1614D04c6e2854dfAb2246Ece6e0db070",
  KEYSTORE: "barrel-deployer",
  XOM: "0xf9B46d3D1B22199D4D1025a9cEDB540A33F1a2d5",
  EXPORT_BARRELS: "300",
  EXPORT_USD_MICROS: "1000",
  EXPORT_DAILY_QUOTA: "5000",
  COST_CAP_ETH: "0.15",
  RESERVE_TARGET_ETH: "0.45",
  RIG_BASE_URI: "https://barrelroyale.io/rigs/",
};
const PAYEES = [
  ["TREASURY", "Rig mint proceeds"],
  ["PAYEE_COSTS", "Running costs"],
  ["PAYEE_RESERVE", "Reserve"],
  ["PAYEE_XOM_BUYER", "XOM purchases for the vault"],
  ["PAYEE_DEV", "Development and operations"],
  ["PAYEE_BUYBACK", "$ROYAL buyback and burn"],
  ["PAYEE_PRIZES", "Crew war prizes"],
];
const PHASES = { og: 1, crew: 2, public: 3, ended: 4 };

/* ---------------- terminal ---------------- */

const tty = process.stdout.isTTY;
const paint = (code) => (s) => (tty ? `\x1b[${code}m${s}\x1b[0m` : String(s));
const bold = paint(1);
const dim = paint(2);
const green = paint(32);
const yellow = paint(33);
const red = paint(31);
const cyan = paint(36);

// Line mode, not raw mode, so forge and cast can still ask for the keystore password in the same terminal.
const rl = createInterface({ input: process.stdin, terminal: false });
const lines = rl[Symbol.asyncIterator]();
let stepNo = 0;
const step = (title) => console.log(`\n${bold(cyan(`[${++stepNo}]`))} ${bold(title)}`);
const ok = (msg) => console.log(`  ${green("✓")} ${msg}`);
const warn = (msg) => console.log(`  ${yellow("!")} ${msg}`);
const info = (msg) => console.log(`  ${dim("·")} ${msg}`);
function fail(msg) {
  console.log(`\n  ${red("✗")} ${msg}\n`);
  rl.close();
  process.exit(1);
}

async function ask(question, fallback = "") {
  const hint = fallback ? dim(` [${fallback}]`) : "";
  process.stdout.write(`  ${question}${hint}: `);
  const { value, done } = await lines.next();
  if (done) fail("Input closed before every question was answered.");
  if (!tty) process.stdout.write("\n");
  return value.trim() || fallback;
}

async function askAddress(question, fallback) {
  for (;;) {
    const value = await ask(question, fallback);
    if (/^0x[0-9a-fA-F]{40}$/.test(value)) return value;
    warn("That is not an address. It starts with 0x and has 40 hex characters after it.");
  }
}

/* ---------------- foundry ---------------- */

function tool(name) {
  const exe = process.platform === "win32" ? `${name}.exe` : name;
  const local = join(homedir(), ".foundry", "bin", exe);
  return existsSync(local) ? local : name;
}
const FORGE = tool("forge");
const CAST = tool("cast");

/** Run a command. `interactive` hands the terminal over, so forge and cast can ask for the keystore password. */
function run(cmd, args, { env = {}, interactive = false } = {}) {
  const res = spawnSync(cmd, args, {
    cwd: ROOT,
    env: { ...process.env, ...env },
    encoding: "utf8",
    stdio: interactive ? "inherit" : "pipe",
    maxBuffer: 64 * 1024 * 1024,
  });
  if (res.error) fail(`Could not run ${cmd}: ${res.error.message}`);
  return { code: res.status, out: `${res.stdout ?? ""}${res.stderr ?? ""}` };
}

const cast = (...args) => {
  const r = run(CAST, args);
  if (r.code !== 0) throw new Error(r.out.trim());
  return r.out.trim();
};
const callView = (to, sig) => cast("call", to, sig, "--rpc-url", RPC);
const calldata = (sig, ...args) => cast("calldata", sig, ...args);

/* ---------------- .env ---------------- */

function readEnv() {
  if (!existsSync(ENV_FILE)) return {};
  const env = {};
  for (const line of readFileSync(ENV_FILE, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return env;
}

function writeEnv(env) {
  const lines = ["# Written by launch.mjs. Addresses and amounts only: no keys live here.", ""];
  for (const [k, v] of Object.entries(env)) lines.push(`${k}=${v}`);
  writeFileSync(ENV_FILE, `${lines.join("\n")}\n`);
}

/* ---------------- Safe batches ---------------- */

function writeBatch(file, name, description, txs) {
  mkdirSync(OUT, { recursive: true });
  const batch = {
    version: "1.0",
    chainId: String(CHAIN_ID),
    createdAt: Date.now(),
    meta: { name, description },
    transactions: txs.map((t) => ({ to: t.to, value: "0", data: t.data })),
  };
  const path = join(OUT, file);
  writeFileSync(path, `${JSON.stringify(batch, null, 2)}\n`);
  return path;
}

function readDeployment() {
  if (!existsSync(DEPLOYMENT)) fail(`No deployment found. Run ${bold("node launch.mjs")} first.`);
  return JSON.parse(readFileSync(DEPLOYMENT, "utf8"));
}

/* ---------------- checks ---------------- */

async function preflight(env) {
  step("Tools");
  const v = run(FORGE, ["--version"]);
  if (v.code !== 0) fail("Foundry is not installed. Install it from https://getfoundry.sh and run this again.");
  ok(v.out.split("\n")[0]);
  if (!existsSync(join(ROOT, "lib", "openzeppelin-contracts")) || !existsSync(join(ROOT, "lib", "forge-std"))) {
    info("Installing forge-std and OpenZeppelin 5.1 ...");
    const r = run(FORGE, ["install", "foundry-rs/forge-std", "OpenZeppelin/openzeppelin-contracts@v5.1.0", "--no-git"]);
    if (r.code !== 0) fail(`forge install failed:\n${r.out}`);
  }
  ok("Libraries ready");

  step("Tests");
  const t = run(FORGE, ["test"]);
  const summary = t.out.match(/(\d+) tests passed, (\d+) failed/);
  if (t.code !== 0 || !summary || summary[2] !== "0") fail(`Tests failed:\n${t.out.slice(-3000)}`);
  ok(`${summary[1]} tests passed`);

  step("Robinhood Chain");
  const chain = Number(cast("chain-id", "--rpc-url", RPC));
  if (chain !== CHAIN_ID) fail(`The RPC answered chain ${chain}, expected ${CHAIN_ID}.`);
  ok(`Connected to chain ${CHAIN_ID}`);

  const safeCode = cast("code", env.OWNER, "--rpc-url", RPC);
  if (safeCode === "0x") fail(`${env.OWNER} has no contract on Robinhood Chain. OWNER must be the Safe.`);
  const owners = callView(env.OWNER, "getOwners()(address[])");
  const threshold = Number(callView(env.OWNER, "getThreshold()(uint256)"));
  const signers = owners.replace(/[[\]\s]/g, "").split(",").filter(Boolean);
  ok(`Safe ${env.OWNER}: ${threshold} of ${signers.length} signers`);
  if (threshold < 2) {
    warn(`The docs describe a multisig. Add signers and raise the threshold to 2 or more at app.safe.global; it can be done any time.`);
  }

  const name = callView(env.XOM, "name()(string)");
  const decimals = callView(env.XOM, "decimals()(uint8)");
  ok(`XOM ${env.XOM}: ${name}, ${decimals} decimals`);

  const balance = cast("balance", env.DEPLOYER, "--rpc-url", RPC, "--ether");
  ok(`Deployer ${env.DEPLOYER} holds ${balance} ETH`);
  return Number(balance);
}

async function configure(env) {
  step("Settings");
  info(`Saved to ${ENV_FILE}. Press Enter to keep the value in brackets.`);
  env.OWNER = await askAddress("Safe that owns every contract (OWNER)", env.OWNER || DEFAULTS.OWNER);
  env.DEPLOYER = await askAddress("Deployer wallet", env.DEPLOYER || DEFAULTS.DEPLOYER);
  env.KEYSTORE = await ask("Foundry keystore name for the deployer", env.KEYSTORE || DEFAULTS.KEYSTORE);
  env.XOM = await askAddress("XOM token", env.XOM || DEFAULTS.XOM);
  for (const [key, label] of PAYEES) env[key] = await askAddress(`${label} (${key})`, env[key] || env.OWNER);
  env.COST_CAP_ETH = await ask("Running cost cap per 30 days, in ETH", env.COST_CAP_ETH || DEFAULTS.COST_CAP_ETH);
  env.RESERVE_TARGET_ETH = await ask("Reserve target, in ETH", env.RESERVE_TARGET_ETH || DEFAULTS.RESERVE_TARGET_ETH);
  env.EXPORT_BARRELS = await ask("Export: barrels per payout", env.EXPORT_BARRELS || DEFAULTS.EXPORT_BARRELS);
  env.EXPORT_USD_MICROS = await ask("Export: payout in millionths of a dollar of XOM", env.EXPORT_USD_MICROS || DEFAULTS.EXPORT_USD_MICROS);
  env.EXPORT_DAILY_QUOTA = await ask("Export: daily quota in barrels per rig", env.EXPORT_DAILY_QUOTA || DEFAULTS.EXPORT_DAILY_QUOTA);
  env.RIG_BASE_URI = await ask("Rig metadata base URL", env.RIG_BASE_URI || DEFAULTS.RIG_BASE_URI);
  env.COST_CAP_WEI = cast("to-wei", env.COST_CAP_ETH, "ether");
  env.RESERVE_TARGET_WEI = cast("to-wei", env.RESERVE_TARGET_ETH, "ether");
  writeEnv(env);
  ok("Settings saved");
  return env;
}

function dryRun(env, script) {
  step("Dry run against mainnet");
  const r = run(FORGE, ["script", script, "--rpc-url", RPC, "--sender", env.DEPLOYER], { env });
  if (r.code !== 0) fail(`The dry run failed:\n${r.out.slice(-3000)}`);
  for (const m of r.out.matchAll(/^\s+(\w+)\s+(0x[0-9a-fA-F]{40})$/gm)) info(`${m[1]} would deploy at ${m[2]}`);
  const est = Number(r.out.match(/Estimated amount required:\s*([\d.]+)\s*ETH/)?.[1] ?? 0);
  ok(`Simulation passed. Estimated cost ${est} ETH`);
  return est;
}

function ensureKeystore(env) {
  step("Deployer key");
  if (REHEARSAL) {
    cast("rpc", "anvil_impersonateAccount", env.DEPLOYER, "--rpc-url", RPC);
    ok("Rehearsal: the deployer is impersonated on the fork");
    return;
  }
  const list = run(CAST, ["wallet", "list"]).out;
  if (list.split(/\r?\n/).some((l) => l.trim().startsWith(env.KEYSTORE))) {
    ok(`Keystore "${env.KEYSTORE}" found`);
    return;
  }
  info(`No keystore named "${env.KEYSTORE}" yet. cast will now ask for the deployer's private key and a password.`);
  info("The key is encrypted into ~/.foundry/keystores and never written anywhere else.");
  const r = run(CAST, ["wallet", "import", env.KEYSTORE, "--interactive"], { interactive: true });
  if (r.code !== 0) fail("The keystore was not created.");
  ok(`Keystore "${env.KEYSTORE}" created`);
}

async function confirm(word) {
  const answer = await ask(`Type ${bold(word)} to broadcast, anything else to stop`);
  if (answer !== word) fail("Stopped. Nothing was sent.");
}

function broadcast(env, script) {
  step("Broadcast");
  const signer = REHEARSAL ? ["--unlocked"] : ["--account", env.KEYSTORE];
  if (!REHEARSAL) info("forge will ask for the keystore password.");
  const args = ["script", script, "--rpc-url", RPC, ...signer, "--sender", env.DEPLOYER, "--broadcast"];
  const r = run(FORGE, args, { env, interactive: true });
  if (r.code !== 0) {
    fail(`The broadcast did not finish. Check the deployer on ${EXPLORER}/address/${env.DEPLOYER} before running again, so nothing is deployed twice.`);
  }
  ok("Transactions confirmed");

  if (REHEARSAL) return;
  step("Source verification");
  const v = run(FORGE, [...args.filter((a) => a !== "--broadcast"), "--resume", "--verify", "--verifier", "blockscout", "--verifier-url", `${EXPLORER}/api/`], {
    env,
    interactive: true,
  });
  if (v.code === 0) ok("Sources verified on the explorer");
  else warn("Verification can be retried later with the same command; the contracts are live either way.");
}

function readBroadcast(script) {
  const file = join(ROOT, "broadcast", script.split("/").pop(), String(CHAIN_ID), "run-latest.json");
  if (!existsSync(file)) fail(`Could not find ${file}.`);
  const run_ = JSON.parse(readFileSync(file, "utf8"));
  const contracts = {};
  for (const tx of run_.transactions) if (tx.transactionType === "CREATE") contracts[tx.contractName] = { address: tx.contractAddress, tx: tx.hash };
  return contracts;
}

/* ---------------- modes ---------------- */

async function deploy(checkOnly) {
  console.log(bold("\nBarrel Royale · contract launcher · Robinhood Chain mainnet"));
  const env = await configure({ ...DEFAULTS, ...readEnv() });
  const balance = await preflight(env);
  const est = dryRun(env, "script/Deploy.s.sol");
  if (balance < est) fail(`The deployer needs at least ${est} ETH and holds ${balance}.`);
  if (checkOnly) {
    console.log(`\n${green("Ready.")} Run ${bold("node launch.mjs")} to deploy.\n`);
    return;
  }
  ensureKeystore(env);

  step("Seed for the rig class draw");
  mkdirSync(OUT, { recursive: true });
  let seed;
  if (existsSync(SEED_FILE)) {
    seed = JSON.parse(readFileSync(SEED_FILE, "utf8")).seed;
    ok(`Using the seed in ${SEED_FILE}`);
  } else {
    seed = `0x${randomBytes(32).toString("hex")}`;
    writeFileSync(SEED_FILE, `${JSON.stringify({ seed, note: "Keep secret until the reveal. Back this file up." }, null, 2)}\n`);
    ok(`New seed written to ${SEED_FILE}`);
  }
  const seedHash = cast("keccak", seed);
  info(`Seed hash ${seedHash} (public; it goes on-chain before the first mint)`);
  warn("Back up the seed file somewhere safe. It is needed for the reveal and is not in git.");

  const price = await ask("Rig mint price in ETH (leave empty to set it later)", env.RIG_PRICE_ETH || "");
  if (price) env.RIG_PRICE_ETH = price;
  writeEnv(env);

  await confirm("deploy");
  broadcast(env, "script/Deploy.s.sol");

  const contracts = readBroadcast("script/Deploy.s.sol");
  const deployment = { chainId: CHAIN_ID, owner: env.OWNER, deployer: env.DEPLOYER, deployedAt: new Date().toISOString(), contracts };
  writeFileSync(DEPLOYMENT, `${JSON.stringify(deployment, null, 2)}\n`);

  step("Safe batch for the mint setup");
  const rig = contracts.RigNFT.address;
  const txs = [{ to: rig, data: calldata("commitSeed(bytes32)", seedHash) }];
  if (price) txs.unshift({ to: rig, data: calldata("setPrice(uint256)", cast("to-wei", price, "ether")) });
  const batch = writeBatch(
    "safe-1-mint-setup.json",
    "Barrel Royale: rig mint setup",
    `${price ? `Set the rig price to ${price} ETH and commit` : "Commit"} the class seed hash ${seedHash}.`,
    txs,
  );
  ok(`Written to ${batch}`);

  console.log(`\n${green(bold("Deployed."))}`);
  for (const [name, c] of Object.entries(contracts)) console.log(`  ${name.padEnd(15)} ${c.address}  ${dim(`${EXPLORER}/address/${c.address}`)}`);
  console.log(`\n${bold("Next")}`);
  console.log(`  1. At app.safe.global, open the Safe → Apps → Transaction Builder → drag in ${bold("deployments/safe-1-mint-setup.json")}, then sign.`);
  console.log(`  2. Send a little XOM to the vault, then fund it: ${contracts.XOMRewardVault.address}`);
  console.log(`  3. Point the launchpad's creator fees at the FeeSplitter: ${contracts.FeeSplitter.address}`);
  console.log(`  4. When the mint opens: ${bold("node launch.mjs phase og")} (then crew, public, ended), and after it ends ${bold("node launch.mjs reveal")}.`);
  console.log(`  5. Once $ROYAL is live: ${bold("node launch.mjs upgrader")}.\n`);
}

async function upgrader() {
  console.log(bold("\nBarrel Royale · RigUpgrader"));
  const deployment = readDeployment();
  const env = { ...DEFAULTS, ...readEnv() };
  step("Settings");
  env.ROYAL = await askAddress("$ROYAL token address", env.ROYAL || "");
  env.RIG = deployment.contracts.RigNFT.address;
  env.ROYAL_DECIMALS = callView(env.ROYAL, "decimals()(uint8)");
  ok(`$ROYAL: ${callView(env.ROYAL, "name()(string)")}, ${env.ROYAL_DECIMALS} decimals`);
  env.UPGRADE_SEMISUB = await ask("Semi-sub, total $ROYAL from Jack-up", env.UPGRADE_SEMISUB || "2000");
  env.UPGRADE_DRILLSHIP = await ask("Drillship, total $ROYAL from Jack-up", env.UPGRADE_DRILLSHIP || "5000");
  env.UPGRADE_ULTRA = await ask("Ultra-deepwater, total $ROYAL from Jack-up", env.UPGRADE_ULTRA || "12000");
  writeEnv(env);

  const est = dryRun(env, "script/DeployUpgrader.s.sol");
  const balance = Number(cast("balance", env.DEPLOYER, "--rpc-url", RPC, "--ether"));
  if (balance < est) fail(`The deployer needs at least ${est} ETH and holds ${balance}.`);
  ensureKeystore(env);
  await confirm("deploy");
  broadcast(env, "script/DeployUpgrader.s.sol");

  const { RigUpgrader } = readBroadcast("script/DeployUpgrader.s.sol");
  deployment.contracts.RigUpgrader = RigUpgrader;
  writeFileSync(DEPLOYMENT, `${JSON.stringify(deployment, null, 2)}\n`);
  const batch = writeBatch("safe-2-upgrader.json", "Barrel Royale: connect the upgrader", `RigNFT.setUpgrader(${RigUpgrader.address}), once and for good.`, [
    { to: env.RIG, data: calldata("setUpgrader(address)", RigUpgrader.address) },
  ]);
  console.log(`\n${green(bold("RigUpgrader deployed"))} at ${RigUpgrader.address}`);
  console.log(`  Sign ${bold(batch)} in the Safe Transaction Builder to connect it.\n`);
}

function phase(name) {
  const id = PHASES[name];
  if (!id) fail(`Use one of: ${Object.keys(PHASES).join(", ")}`);
  const { contracts } = readDeployment();
  const batch = writeBatch(`safe-phase-${name}.json`, `Barrel Royale: mint phase ${name}`, `Move the rig mint to the ${name} phase.`, [
    { to: contracts.RigNFT.address, data: calldata("setPhase(uint8)", String(id)) },
  ]);
  console.log(`\n${green("Written")} ${batch}. Sign it in the Safe Transaction Builder.\n`);
}

function reveal() {
  const { contracts } = readDeployment();
  if (!existsSync(SEED_FILE)) fail(`The seed file ${SEED_FILE} is missing. Restore it from your backup.`);
  const { seed } = JSON.parse(readFileSync(SEED_FILE, "utf8"));
  const batch = writeBatch("safe-reveal.json", "Barrel Royale: reveal rig classes", "Reveal the class seed committed before the mint.", [
    { to: contracts.RigNFT.address, data: calldata("reveal(bytes32)", seed) },
  ]);
  console.log(`\n${green("Written")} ${batch}. Sign it after the mint has ended or sold out.\n`);
}

/* ---------------- browser launcher ---------------- */

const UI_PORT = 8790;
const UI_PAGE = join(ROOT, "launcher.html");
const CONTRACTS = ["XOMRewardVault", "RigNFT", "FeeSplitter", "RigUpgrader"];
const SAFE_FILE = /^safe-[a-z0-9-]+\.json$/;

/** Serves launcher.html on localhost with the compiled contracts filled in, and saves what it deploys. */
async function ui() {
  console.log(bold("\nBarrel Royale · browser launcher"));
  if (!existsSync(UI_PAGE)) fail(`${UI_PAGE} is missing. It is kept out of git; copy it into contracts/.`);
  step("Compile");
  const b = run(FORGE, ["build"]);
  if (b.code !== 0) fail(`forge build failed:\n${b.out.slice(-3000)}`);
  ok("Contracts compiled");

  const artifacts = () =>
    Object.fromEntries(
      CONTRACTS.map((n) => {
        const j = JSON.parse(readFileSync(join(ROOT, "out", `${n}.sol`, `${n}.json`), "utf8"));
        return [n, { abi: j.abi, bytecode: j.bytecode.object }];
      }),
    );
  const config = () => ({
    chainId: CHAIN_ID,
    rpc: RPC,
    explorer: EXPLORER,
    rehearsal: REHEARSAL,
    defaults: { ...DEFAULTS, ...readEnv() },
    deployment: existsSync(DEPLOYMENT) ? JSON.parse(readFileSync(DEPLOYMENT, "utf8")) : null,
    hasSeed: existsSync(SEED_FILE),
  });

  const body = (req) =>
    new Promise((resolve, reject) => {
      let data = "";
      req.on("data", (c) => (data += c));
      req.on("end", () => {
        try {
          resolve(data ? JSON.parse(data) : {});
        } catch (e) {
          reject(e);
        }
      });
    });
  const send = (res, status, payload, type = "application/json") => {
    res.writeHead(status, { "content-type": type, "cache-control": "no-store" });
    res.end(type === "application/json" ? JSON.stringify(payload) : payload);
  };

  const server = createServer(async (req, res) => {
    try {
      // only this machine's own page may call the API
      const origins = [`http://127.0.0.1:${UI_PORT}`, `http://localhost:${UI_PORT}`];
      if (req.method === "POST" && req.headers.origin && !origins.includes(req.headers.origin)) return send(res, 403, { error: "Forbidden" });
      if (req.method === "GET" && (req.url === "/" || req.url === "/index.html")) {
        const html = readFileSync(UI_PAGE, "utf8")
          .replace("/*ARTIFACTS*/null", JSON.stringify(artifacts()))
          .replace("/*CONFIG*/null", JSON.stringify(config()));
        return send(res, 200, html, "text/html; charset=utf-8");
      }
      if (req.method === "GET" && req.url === "/api/config") return send(res, 200, config());
      if (req.method === "POST" && req.url === "/api/deployment") {
        const d = await body(req);
        mkdirSync(OUT, { recursive: true });
        writeFileSync(DEPLOYMENT, `${JSON.stringify(d, null, 2)}\n`);
        return send(res, 200, { saved: DEPLOYMENT });
      }
      if (req.method === "POST" && req.url === "/api/settings") {
        const s = await body(req);
        writeEnv({ ...readEnv(), ...s });
        return send(res, 200, { saved: ENV_FILE });
      }
      if (req.method === "POST" && req.url === "/api/seed") {
        const { seed } = await body(req);
        if (!/^0x[0-9a-f]{64}$/i.test(seed ?? "")) return send(res, 400, { error: "Bad seed" });
        if (existsSync(SEED_FILE)) return send(res, 409, { error: "A seed is already saved", file: SEED_FILE });
        mkdirSync(OUT, { recursive: true });
        writeFileSync(SEED_FILE, `${JSON.stringify({ seed, note: "Keep secret until the reveal. Back this file up." }, null, 2)}\n`);
        return send(res, 200, { saved: SEED_FILE });
      }
      if (req.method === "GET" && req.url === "/api/seed") {
        if (!existsSync(SEED_FILE)) return send(res, 404, { error: "No seed saved" });
        return send(res, 200, JSON.parse(readFileSync(SEED_FILE, "utf8")));
      }
      if (req.method === "POST" && req.url === "/api/batch") {
        const { file, batch } = await body(req);
        if (!SAFE_FILE.test(file ?? "")) return send(res, 400, { error: "Bad file name" });
        mkdirSync(OUT, { recursive: true });
        const path = join(OUT, file);
        writeFileSync(path, `${JSON.stringify(batch, null, 2)}\n`);
        return send(res, 200, { saved: path });
      }
      if (req.method === "POST" && req.url === "/api/verify") {
        const { name, address, args } = await body(req);
        if (!CONTRACTS.includes(name) || !/^0x[0-9a-fA-F]{40}$/.test(address ?? "") || !/^(0x)?[0-9a-fA-F]*$/.test(args ?? "")) {
          return send(res, 400, { error: "Bad request" });
        }
        if (REHEARSAL) return send(res, 200, { ok: true, output: "Rehearsal: verification skipped." });
        const r = run(FORGE, [
          "verify-contract",
          address,
          `src/${name}.sol:${name}`,
          "--chain-id",
          String(CHAIN_ID),
          "--rpc-url",
          RPC,
          "--verifier",
          "blockscout",
          "--verifier-url",
          `${EXPLORER}/api/`,
          "--constructor-args",
          args.replace(/^0x/, ""),
          "--watch",
        ]);
        return send(res, 200, { ok: r.code === 0, output: r.out.slice(-2000) });
      }
      send(res, 404, { error: "Not found" });
    } catch (e) {
      send(res, 500, { error: e.message });
    }
  });

  await new Promise((resolve) => server.listen(UI_PORT, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${UI_PORT}/`;
  ok(`Open ${bold(url)}${REHEARSAL ? ` ${yellow("(rehearsal on " + RPC + ")")}` : ""}`);
  info("Leave this window open while you use the launcher. Press Ctrl+C to stop.");
  if (!process.env.LAUNCH_NO_BROWSER) {
    const opener = process.platform === "win32" ? ["cmd", ["/c", "start", "", url]] : process.platform === "darwin" ? ["open", [url]] : ["xdg-open", [url]];
    spawn(opener[0], opener[1], { stdio: "ignore", detached: true }).unref();
  }
  rl.close();
  await new Promise(() => {});
}

/* ---------------- main ---------------- */

const [mode = "deploy", arg] = process.argv.slice(2);
try {
  if (mode === "deploy") await deploy(false);
  else if (mode === "check") await deploy(true);
  else if (mode === "upgrader") await upgrader();
  else if (mode === "phase") phase(arg);
  else if (mode === "reveal") reveal();
  else if (mode === "ui") await ui();
  else fail(`Unknown command "${mode}". Use: deploy, check, upgrader, phase <og|crew|public|ended>, reveal, ui.`);
} catch (e) {
  fail(e.message);
} finally {
  rl.close();
}
