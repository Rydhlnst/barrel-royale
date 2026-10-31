import { bonusOpen, bonusSignUp, bonusStatus } from "@/lib/bonus";

// GET ?wallet=0x…: where that wallet stands for the Oil Bonus.
// POST { wallet, issued, signature }: a signed sign-up; returns the new status.

export async function GET(request: Request) {
  if (!bonusOpen) return Response.json({ error: "The Oil Bonus opens soon." }, { status: 503 });
  const wallet = new URL(request.url).searchParams.get("wallet") ?? "";
  try {
    const r = await bonusStatus(wallet);
    if (!r.ok) return Response.json({ error: r.error }, { status: r.status });
    return Response.json(r.status);
  } catch {
    return Response.json({ error: "Could not read the Oil Bonus right now. Try again in a moment." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!bonusOpen) return Response.json({ error: "The Oil Bonus opens soon." }, { status: 503 });
  let b: Record<string, unknown>;
  try {
    b = await request.json();
  } catch {
    return Response.json({ error: "Bad request." }, { status: 400 });
  }
  const str = (k: string) => (typeof b[k] === "string" ? (b[k] as string) : "");
  try {
    const r = await bonusSignUp({ wallet: str("wallet"), issued: str("issued"), signature: str("signature") });
    if (!r.ok) return Response.json({ error: r.error }, { status: r.status });
    return Response.json(r.status);
  } catch {
    return Response.json({ error: "Could not sign you up right now. Try again in a moment." }, { status: 503 });
  }
}
