// Builds the next Oil Bonus round for the reward vault: the next wallets in line, as many as one round can
// hold (at most 10% of the vault's free balance), each paid OIL_BONUS.wei.
//
// Usage, from apps/web with the production DATABASE_URL in the environment (vercel env pull):
//   node scripts/bonus-round.mjs                 dry run: who would be in the round, the root and the total
//   node scripts/bonus-round.mjs --write         also stores each wallet's proof and writes public/rounds/
//   node scripts/bonus-round.mjs --week 2961     pick the round's week number (default: weeks since 1970)
//
// After --write, deploy the site (so public/rounds/ publishes the list), then have the treasury multisig call
// postRound(week, root, total) on the vault with the calldata this prints. Claims open two days later.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";
import { createPublicClient, encodeFunctionData, formatUnits, http, parseAbi } from "viem";
import { buildTree, leafOf, verify } from "./merkle.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const content = readFileSync(join(root, "lib/game/content.ts"), "utf8");
const AMOUNT = BigInt(content.match(/OIL_BONUS = \{[^}]*wei: "(\d+)"/)[1]);
const VAULT = readFileSync(join(root, "lib/contracts.ts"), "utf8").match(/vault: "(0x[0-9a-fA-F]{40})"/)[1];
const RPC = "https://rpc.mainnet.chain.robinhood.com";

const args = process.argv.slice(2);
const write = args.includes("--write");
const weekArg = args.indexOf("--week");
const week = weekArg >= 0 ? Number(args[weekArg + 1]) : Math.floor(Date.now() / (7 * 86_400_000));
if (!Number.isInteger(week) || week <= 0) throw new Error("--week needs a whole number.");
if (!process.env.DATABASE_URL) throw new Error("Set DATABASE_URL (vercel env pull) first.");

const abi = parseAbi([
  "function freeBalance() view returns (uint256)",
  "function lastPostedAt() view returns (uint256)",
  "function rounds(uint256) view returns (bytes32 root, uint128 total, uint128 claimed, uint64 postedAt, uint64 pausedAtPost, bool closed)",
  "function postRound(uint256 week, bytes32 root, uint128 total)",
]);
const chain = createPublicClient({ transport: http(RPC) });
const [free, lastPostedAt, existing] = await Promise.all([
  chain.readContract({ address: VAULT, abi, functionName: "freeBalance" }),
  chain.readContract({ address: VAULT, abi, functionName: "lastPostedAt" }),
  chain.readContract({ address: VAULT, abi, functionName: "rounds", args: [BigInt(week)] }),
]);
if (existing[0] !== "0x" + "0".repeat(64)) throw new Error(`Week ${week} already has a round on the vault. Pick another --week.`);
const cap = Number((free * 1_000n) / 10_000n / AMOUNT);
const nextAllowed = Number(lastPostedAt) ? new Date((Number(lastPostedAt) + 6 * 86_400) * 1000) : null;

const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });
try {
  await build();
} finally {
  await sql.end();
}

async function build() {
  const [{ taken }] = await sql`select count(*)::int as taken from oil_bonus where week = ${week}`;
  if (taken) throw new Error(`Week ${week} is already built in the database (${taken} wallets).`);
  const line = await sql`select wallet from oil_bonus where week is null order by signed_at, wallet limit ${cap}`;
  const [{ waiting }] = await sql`select count(*)::int as waiting from oil_bonus where week is null`;
  console.log(`Vault free balance ${formatUnits(free, 18)} XOM; one round can pay ${cap} bonuses of ${formatUnits(AMOUNT, 18)} XOM.`);
  console.log(`${waiting} wallets in line; this round takes ${line.length}.`);
  if (nextAllowed && nextAllowed > new Date()) console.log(`Note: the vault takes the next round from ${nextAllowed.toISOString()}.`);
  if (!line.length) return;

  const entries = line.map((r) => ({ account: r.wallet, amount: AMOUNT }));
  const tree = buildTree(entries);
  entries.forEach((e, i) => {
    if (!verify(tree.proofs[i], tree.root, leafOf(e.account, e.amount))) throw new Error(`Proof check failed for ${e.account}.`);
  });
  const total = AMOUNT * BigInt(entries.length);
  const data = encodeFunctionData({ abi, functionName: "postRound", args: [BigInt(week), tree.root, total] });
  console.log(`\nweek  ${week}\nroot  ${tree.root}\ntotal ${total} (${formatUnits(total, 18)} XOM)`);
  console.log(`\nMultisig transaction\n  to    ${VAULT}\n  value 0\n  data  ${data}`);

  if (!write) {
    console.log("\nDry run. Add --write to store the proofs and write the published list.");
    return;
  }
  await sql.begin(async (tx) => {
    for (let i = 0; i < entries.length; i++)
      await tx`update oil_bonus set week = ${week}, amount = ${AMOUNT.toString()}, proof = ${tx.json(tree.proofs[i])} where wallet = ${entries[i].account} and week is null`;
  });
  const out = join(root, "public/rounds");
  mkdirSync(out, { recursive: true });
  const file = join(out, `oil-bonus-week-${week}.json`);
  writeFileSync(
    file,
    JSON.stringify(
      { round: "Oil Bonus", week, vault: VAULT, root: tree.root, total: total.toString(), wallets: entries.map((e, i) => ({ wallet: e.account, amount: e.amount.toString(), proof: tree.proofs[i] })) },
      null,
      2,
    ) + "\n",
  );
  console.log(`\nStored ${entries.length} proofs and wrote ${file}.`);
}
