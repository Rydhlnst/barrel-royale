import { say, villageOpen } from "@/lib/village";

// POST { token, text }: one line in the village chat.

export async function POST(request: Request) {
  if (!villageOpen) return Response.json({ error: "The village opens soon." }, { status: 503 });
  let b: Record<string, unknown>;
  try {
    b = await request.json();
  } catch {
    return Response.json({ error: "Bad request." }, { status: 400 });
  }
  const r = await say({ token: b.token, text: b.text });
  if (!r.ok) return Response.json({ error: r.error }, { status: r.status });
  return Response.json(r);
}
