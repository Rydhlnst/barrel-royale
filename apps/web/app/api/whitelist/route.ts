import { join, spot, whitelistOpen } from "@/lib/whitelist";
import { patterns } from "@/lib/whitelist-rules";

// POST joins the whitelist; GET ?wallet=0x… returns that wallet's spot.

const closed = () => Response.json({ error: "The whitelist opens soon. Follow us on X for the date." }, { status: 503 });

// Best-effort limit per instance: 5 joins a minute from one address.
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 5;
}

export async function POST(request: Request) {
  if (!whitelistOpen) return closed();
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "local";
  if (limited(ip)) return Response.json({ error: "Too many tries. Wait a minute and try again." }, { status: 429 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Bad request." }, { status: 400 });
  }
  const str = (k: string) => (typeof body[k] === "string" ? (body[k] as string).trim() : "");

  // a hidden field people never see; bots fill it in
  if (str("website")) return Response.json({ error: "Bad request." }, { status: 400 });

  const wallet = str("wallet");
  const x = str("x");
  const email = str("email");
  const ref = str("ref").toUpperCase();
  if (!patterns.wallet.test(wallet)) return Response.json({ error: "Enter a wallet address that starts with 0x and has 40 characters after it." }, { status: 400 });
  if (!patterns.x.test(x)) return Response.json({ error: "Enter your X handle, like @barrelroyale." }, { status: 400 });
  if (email && !patterns.email.test(email)) return Response.json({ error: "That email address doesn't look right." }, { status: 400 });

  const result = await join({ wallet, x, email: email || undefined, ref: patterns.code.test(ref) ? ref : undefined });
  if (!result.ok) return Response.json({ error: result.error }, { status: result.status });
  return Response.json({ spot: result.spot, existing: result.existing });
}

export async function GET(request: Request) {
  if (!whitelistOpen) return closed();
  const wallet = new URL(request.url).searchParams.get("wallet") ?? "";
  if (!patterns.wallet.test(wallet)) return Response.json({ error: "Enter a valid wallet address." }, { status: 400 });
  const s = await spot(wallet);
  if (!s) return Response.json({ error: "That wallet isn't on the list yet." }, { status: 404 });
  return Response.json({ spot: s });
}
