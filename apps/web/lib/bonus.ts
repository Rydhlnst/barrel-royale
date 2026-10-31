import "server-only";
import postgres from "postgres";
import { createPublicClient, http, parseAbi, verifyMessage } from "viem";
import { ROBINHOOD_CHAIN, royalBalance } from "@/lib/chain";
import { CONTRACTS } from "@/lib/contracts";
import { site } from "@/lib/site";
import { bonusMessage, type BonusStatus } from "@/lib/bonus-rules";

// The Oil Bonus queue. A holder wallet signs up once by signing a message; the server checks the signature
// and the $ROYAL hold and puts the wallet in line. scripts/bonus-round.mjs then takes the next wallets in
// line into a weekly vault round, stores each one's Merkle proof here, and the treasury multisig posts the
// root. From then on a wallet's status comes from the vault itself: posted, open to claim, or claimed.

const serverless = Boolean(process.env.VERCEL);
const sql = process.env.DATABASE_URL
  ? postgres(process.env.DATABASE_URL, { max: serverless ? 1 : 3, idle_timeout: serverless ? 5 : 30, prepare: false })
  : null;
export const bonusOpen = sql !== null;

let ready: Promise<void> | null = null;
function schema() {
  ready ??= (async () => {
    await sql!`
      create table if not exists oil_bonus (
        wallet text primary key,
        signed_at timestamptz not null default now(),
        week bigint,
        amount text,
        proof jsonb
      )`;
  })().catch((e) => {
    ready = null;
    throw e;
  });
  return ready;
}

const vault = createPublicClient({ transport: http(ROBINHOOD_CHAIN.rpc) });
const VAULT_ABI = parseAbi([
  "function rounds(uint256) view returns (bytes32 root, uint128 total, uint128 claimed, uint64 postedAt, uint64 pausedAtPost, bool closed)",
  "function hasClaimed(uint256, address) view returns (bool)",
  "function claimOpensAt(uint256) view returns (uint256)",
  "function claimDeadline(uint256) view returns (uint256)",
]);
const address = CONTRACTS.vault as `0x${string}`;

type Fail = { ok: false; status: number; error: string };
const fail = (status: number, error: string): Fail => ({ ok: false, status, error });
const WALLET = /^0x[0-9a-fA-F]{40}$/;

/** Where a wallet stands: not signed up, in line, in a round, or paid. */
export async function bonusStatus(raw: string): Promise<{ ok: true; status: BonusStatus } | Fail> {
  if (!WALLET.test(raw)) return fail(400, "That wallet address doesn't look right.");
  const wallet = raw.toLowerCase();
  await schema();
  const [row] = await sql!<{ signed_at: Date; week: string | null; amount: string | null; proof: string[] | null }[]>`
    select signed_at, week, amount, proof from oil_bonus where wallet = ${wallet}`;
  if (!row) return { ok: true, status: { state: "open" } };
  if (row.week === null) {
    const [{ count }] = await sql!<{ count: string }[]>`select count(*) from oil_bonus where week is null and signed_at <= ${row.signed_at}`;
    return { ok: true, status: { state: "queued", place: Number(count) } };
  }
  const week = Number(row.week);
  const [, , , postedAt] = await vault.readContract({ address, abi: VAULT_ABI, functionName: "rounds", args: [BigInt(week)] });
  if (!postedAt) return { ok: true, status: { state: "posting", week } };
  const [claimed, opensAt, deadline] = await Promise.all([
    vault.readContract({ address, abi: VAULT_ABI, functionName: "hasClaimed", args: [BigInt(week), wallet as `0x${string}`] }),
    vault.readContract({ address, abi: VAULT_ABI, functionName: "claimOpensAt", args: [BigInt(week)] }),
    vault.readContract({ address, abi: VAULT_ABI, functionName: "claimDeadline", args: [BigInt(week)] }),
  ]);
  if (claimed) return { ok: true, status: { state: "claimed", week } };
  const now = BigInt(Math.floor(Date.now() / 1000));
  if (now > deadline) return { ok: true, status: { state: "expired", week } };
  if (now < opensAt) return { ok: true, status: { state: "posted", week, opensAt: Number(opensAt) * 1000 } };
  return { ok: true, status: { state: "claimable", week, amount: row.amount!, proof: row.proof! } };
}

/** Checks the signed message and the $ROYAL hold, then puts the wallet in line (once). */
export async function bonusSignUp(input: { wallet: string; issued: string; signature: string }) {
  if (!WALLET.test(input.wallet)) return fail(400, "That wallet address doesn't look right.");
  const wallet = input.wallet.toLowerCase();
  const issued = Date.parse(input.issued);
  if (!Number.isFinite(issued) || Math.abs(Date.now() - issued) > 10 * 60_000) return fail(400, "That signature is too old. Try again.");

  // local development (NEXT_PUBLIC_DEV_OPEN_PLAY=1, never in a production build) skips the wallet popup
  const devSkip = site.devOpenPlay && input.signature === "dev";
  if (!devSkip) {
    let valid = false;
    try {
      valid = await verifyMessage({ address: wallet as `0x${string}`, message: bonusMessage(wallet, input.issued), signature: input.signature as `0x${string}` });
    } catch {
      valid = false;
    }
    if (!valid) return fail(401, "The signature didn't match this wallet.");
  }
  if (site.ca && !site.devOpenPlay) {
    let balance = 0;
    try {
      balance = await royalBalance(site.ca, wallet);
    } catch {
      return fail(503, `Could not read your ${site.token} balance. Try again in a moment.`);
    }
    if (balance < site.minHold) return fail(403, `The Oil Bonus is for wallets holding ${site.minHold.toLocaleString("en-US")} ${site.token} or more.`);
  }

  await schema();
  await sql!`insert into oil_bonus (wallet) values (${wallet}) on conflict (wallet) do nothing`;
  return bonusStatus(wallet);
}
