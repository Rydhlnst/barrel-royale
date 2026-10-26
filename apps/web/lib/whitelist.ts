import "server-only";
import postgres from "postgres";
import { POINTS_JOIN, POINTS_REFERRAL, tierFor, type Spot } from "./whitelist-rules";

// The whitelist lives in one Postgres table: the Postgres container next to the
// app on the VPS, or any hosted Postgres (Neon works too; add ?sslmode=require).
// Points come from joining and from people who join with your referral code;
// rank decides the tier at snapshot. Without DATABASE_URL the whitelist reports
// itself closed.

// On Vercel every function instance opens its own connection, so keep it to one
// and let it close quickly; prepared statements are off so a pooled (PgBouncer)
// URL such as Neon's "-pooler" host works too.
const serverless = Boolean(process.env.VERCEL);
const sql = process.env.DATABASE_URL
  ? postgres(process.env.DATABASE_URL, { max: serverless ? 1 : 5, idle_timeout: serverless ? 5 : 30, prepare: false })
  : null;
export const whitelistOpen = sql !== null;

let ready: Promise<void> | null = null;
function schema() {
  ready ??= sql!`
    create table if not exists whitelist (
      id serial primary key,
      wallet text not null unique,
      x_handle text not null unique,
      email text,
      code text not null unique,
      referred_by text,
      created_at timestamptz not null default now()
    )`.then(() => undefined);
  return ready;
}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const newCode = () => Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => ALPHABET[b % ALPHABET.length]).join("");

/** One wallet's place on the list, or null if it hasn't joined. */
export async function spot(wallet: string): Promise<Spot | null> {
  await schema();
  const rows = (await sql!`
    with scored as (
      select w.wallet, w.code, w.created_at,
             (select count(*) from whitelist r where r.referred_by = w.code)::int as referrals
      from whitelist w
    ), ranked as (
      select *, rank() over (order by referrals desc, created_at asc)::int as rank, count(*) over ()::int as total
      from scored
    )
    select code, referrals, rank, total from ranked where wallet = ${wallet.toLowerCase()}`) as unknown as {
    code: string;
    referrals: number;
    rank: number;
    total: number;
  }[];
  const r = rows[0];
  if (!r) return null;
  return { ...r, points: POINTS_JOIN + POINTS_REFERRAL * r.referrals, tier: tierFor(r.rank) };
}

export type JoinResult = { ok: true; spot: Spot; existing: boolean } | { ok: false; status: number; error: string };

export async function join(input: { wallet: string; x: string; email?: string; ref?: string }): Promise<JoinResult> {
  await schema();
  const wallet = input.wallet.toLowerCase();
  const x = input.x.replace(/^@/, "").toLowerCase();

  const existing = await spot(wallet);
  if (existing) return { ok: true, spot: existing, existing: true };

  const taken = await sql!`select 1 from whitelist where x_handle = ${x}`;
  if (taken.length) return { ok: false, status: 409, error: "That X handle is already on the list with another wallet." };

  // only keep a referral code that exists
  let ref: string | null = null;
  if (input.ref) {
    const found = await sql!`select 1 from whitelist where code = ${input.ref}`;
    if (found.length) ref = input.ref;
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      await sql!`
        insert into whitelist (wallet, x_handle, email, code, referred_by)
        values (${wallet}, ${x}, ${input.email || null}, ${newCode()}, ${ref})`;
      return { ok: true, spot: (await spot(wallet))!, existing: false };
    } catch (e) {
      const msg = String(e);
      if (msg.includes("whitelist_code_key")) continue; // code collision, try another
      if (msg.includes("whitelist_wallet_key")) return { ok: true, spot: (await spot(wallet))!, existing: true };
      if (msg.includes("whitelist_x_handle_key")) return { ok: false, status: 409, error: "That X handle is already on the list with another wallet." };
      throw e;
    }
  }
  return { ok: false, status: 500, error: "Could not create a referral code. Try again." };
}
