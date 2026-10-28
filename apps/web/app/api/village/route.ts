import { leave, tick, villageOpen } from "@/lib/village";

// POST: a player's position report; returns who else is in the village and the new chat lines.
// DELETE: the player leaves.

const closed = () => Response.json({ error: "The village opens soon." }, { status: 503 });

async function body(request: Request) {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  if (!villageOpen) return closed();
  const b = await body(request);
  if (!b) return Response.json({ error: "Bad request." }, { status: 400 });
  const r = await tick({ token: b.token, x: b.x, y: b.y, facing: b.facing, moving: b.moving, level: b.level, since: b.since });
  if (!r.ok) return Response.json({ error: r.error }, { status: r.status });
  return Response.json(r);
}

export async function DELETE(request: Request) {
  if (!villageOpen) return closed();
  const b = await body(request);
  await leave(b?.token);
  return new Response(null, { status: 204 });
}
