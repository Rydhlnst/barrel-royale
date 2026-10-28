import { enter, villageOpen } from "@/lib/village";

// POST { wallet, issued, signature }: a signed entry to the village; returns a session token for the day.

export async function POST(request: Request) {
  if (!villageOpen) return Response.json({ error: "The village opens soon." }, { status: 503 });
  let b: Record<string, unknown>;
  try {
    b = await request.json();
  } catch {
    return Response.json({ error: "Bad request." }, { status: 400 });
  }
  const str = (k: string) => (typeof b[k] === "string" ? (b[k] as string) : "");
  const r = await enter({ wallet: str("wallet"), issued: str("issued"), signature: str("signature") });
  if (!r.ok) return Response.json({ error: r.error }, { status: r.status });
  return Response.json(r);
}
