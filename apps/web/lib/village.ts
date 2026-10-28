import "server-only";
import { randomBytes } from "node:crypto";
import postgres from "postgres";
import { verifyMessage } from "viem";
import { royalBalance } from "@/lib/chain";
import { site } from "@/lib/site";
import { VILLAGE, cleanChat, villageMessage } from "@/lib/village-rules";

// The village: a shared harbor where every rig's roughneck can walk around and chat. It lives in the same
// Postgres as the whitelist. A wallet enters by signing a message once; the server checks the signature
// and the $ROYAL hold, then hands out a session token for a day. Each player reports their position about
// once a second and gets back everyone else who reported lately, plus new chat lines.
//
// Moderation is by SQL for now:
//   update village_chat set hidden = true where id = <id>;              -- hide one message
//   insert into village_ban (wallet, reason) values ('0x...', 'spam');  -- keep a wallet out of the chat

const serverless = Boolean(process.env.VERCEL);
const sql = process.env.DATABASE_URL
  ? postgres(process.env.DATABASE_URL, { max: serverless ? 1 : Number(process.env.VILLAGE_DB_POOL) || 3, idle_timeout: serverless ? 5 : 30, prepare: false })
  : null;
export const villageOpen = sql !== null;

let ready: Promise<void> | null = null;
function schema() {
  ready ??= (async () => {
    await sql!`
      create table if not exists village_session (
        token text primary key,
        wallet text not null,
        expires_at timestamptz not null
      )`;
    await sql!`
      create table if not exists village_player (
        wallet text primary key,
        x real not null,
        y real not null,
        facing smallint not null default 0,
        moving boolean not null default false,
        level smallint not null default 1,
        seen_at timestamptz not null default now()
      )`;
    await sql!`
      create table if not exists village_chat (
        id bigserial primary key,
        wallet text not null,
        body text not null,
        hidden boolean not null default false,
        created_at timestamptz not null default now()
      )`;
    await sql!`
      create table if not exists village_ban (
        wallet text primary key,
        reason text,
        created_at timestamptz not null default now()
      )`;
    await sql!`create index if not exists village_player_seen on village_player (seen_at)`;
  })().catch((e) => {
    ready = null;
    throw e;
  });
  return ready;
}

export type VillagePlayer = { wallet: string; x: number; y: number; facing: number; moving: boolean; level: number };
export type VillageLine = { id: number; wallet: string; body: string; at: number };
type Fail = { ok: false; status: number; error: string };
type Row = { id: string; wallet: string; body: string; created_at: Date };

const fail = (status: number, error: string): Fail => ({ ok: false, status, error });
const WALLET = /^0x[0-9a-fA-F]{40}$/;
const clamp = (v: unknown, lo: number, hi: number) => (typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : lo);
const present = `${VILLAGE.presentMs} milliseconds`;

/** Checks the signed message and the $ROYAL hold, then opens a session for the day. */
export async function enter(input: { wallet: string; issued: string; signature: string }) {
  if (!WALLET.test(input.wallet)) return fail(400, "That wallet address doesn't look right.");
  const wallet = input.wallet.toLowerCase();
  const issued = Date.parse(input.issued);
  if (!Number.isFinite(issued) || Math.abs(Date.now() - issued) > 10 * 60_000) return fail(400, "That signature is too old. Try again.");

  // local development (NEXT_PUBLIC_DEV_OPEN_PLAY=1, never in a production build) skips the wallet popup
  const devSkip = site.devOpenPlay && input.signature === "dev";
  if (!devSkip) {
    let valid = false;
    try {
      valid = await verifyMessage({ address: wallet as `0x${string}`, message: villageMessage(wallet, input.issued), signature: input.signature as `0x${string}` });
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
    if (balance < site.minHold) return fail(403, `The village is for wallets holding ${site.minHold.toLocaleString("en-US")} ${site.token} or more.`);
  }

  await schema();
  const token = randomBytes(24).toString("base64url");
  const expires = new Date(Date.now() + VILLAGE.sessionHours * 3_600_000);
  await sql!`insert into village_session (token, wallet, expires_at) values (${token}, ${wallet}, ${expires})`;
  return { ok: true as const, token, wallet, expires: expires.getTime() };
}

async function walletFor(token: unknown) {
  if (typeof token !== "string" || token.length < 20 || token.length > 64) return null;
  const [row] = await sql!<{ wallet: string }[]>`select wallet from village_session where token = ${token} and expires_at > now()`;
  return row?.wallet ?? null;
}

const toLine = (l: Row): VillageLine => ({ id: Number(l.id), wallet: l.wallet, body: l.body, at: new Date(l.created_at).getTime() });

/** One report from a player: store where they are, return everyone else who's here and the new chat. */
export async function tick(input: { token: unknown; x: unknown; y: unknown; facing: unknown; moving: unknown; level: unknown; since: unknown }) {
  await schema();
  const wallet = await walletFor(input.token);
  if (!wallet) return fail(401, "Your village pass ran out. Enter again.");
  const x = clamp(input.x, 0, VILLAGE.width);
  const y = clamp(input.y, 0, VILLAGE.height);
  const facing = Math.round(clamp(input.facing, 0, 3));
  const moving = input.moving === true;
  const level = Math.round(clamp(input.level, 1, 99));
  await sql!`
    insert into village_player (wallet, x, y, facing, moving, level, seen_at)
    values (${wallet}, ${x}, ${y}, ${facing}, ${moving}, ${level}, now())
    on conflict (wallet) do update set x = excluded.x, y = excluded.y, facing = excluded.facing, moving = excluded.moving, level = excluded.level, seen_at = now()`;

  const since = Math.floor(clamp(input.since, 0, Number.MAX_SAFE_INTEGER));
  const [players, lines, counted] = await Promise.all([
    sql!<VillagePlayer[]>`
      select wallet, x, y, facing, moving, level from village_player
      where wallet <> ${wallet} and seen_at > now() - ${present}::interval
      order by seen_at desc limit ${VILLAGE.maxPlayers}`,
    since
      ? sql!<Row[]>`select id, wallet, body, created_at from village_chat where id > ${since} and not hidden order by id limit 50`
      : sql!<Row[]>`
          select * from (select id, wallet, body, created_at from village_chat where not hidden order by id desc limit ${VILLAGE.chatHistory}) recent
          order by id`,
    sql!<{ count: string }[]>`select count(*) from village_player where seen_at > now() - ${present}::interval`,
  ]);

  // now and then, clear out old rows
  if (Math.random() < 0.01) {
    await sql!`delete from village_session where expires_at < now()`;
    await sql!`delete from village_player where seen_at < now() - interval '1 day'`;
    await sql!`delete from village_chat where created_at < now() - interval '7 days'`;
  }

  return {
    ok: true as const,
    you: wallet,
    online: Number(counted[0].count),
    players: players.map((p) => ({ ...p, x: Number(p.x), y: Number(p.y) })),
    chat: lines.map(toLine),
  };
}

/** A chat line: checked against the rules, one every few seconds per wallet. */
export async function say(input: { token: unknown; text: unknown }) {
  await schema();
  const wallet = await walletFor(input.token);
  if (!wallet) return fail(401, "Your village pass ran out. Enter again.");
  const check = cleanChat(typeof input.text === "string" ? input.text : "");
  if (!check.ok) return fail(400, check.error);
  const [ban] = await sql!`select 1 from village_ban where wallet = ${wallet}`;
  if (ban) return fail(403, "This wallet can't post in the village chat.");
  const [last] = await sql!<{ created_at: Date }[]>`select created_at from village_chat where wallet = ${wallet} order by id desc limit 1`;
  if (last && Date.now() - new Date(last.created_at).getTime() < VILLAGE.chatEveryMs) return fail(429, "Easy there, one message every few seconds.");
  const [row] = await sql!<Row[]>`insert into village_chat (wallet, body) values (${wallet}, ${check.text}) returning id, wallet, body, created_at`;
  return { ok: true as const, line: toLine(row) };
}

/** Leaving: drop the player from the square right away. */
export async function leave(token: unknown) {
  await schema();
  const wallet = await walletFor(token);
  if (wallet) await sql!`delete from village_player where wallet = ${wallet}`;
}
