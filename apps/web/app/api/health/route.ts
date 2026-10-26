// For the container health check (Docker, Coolify): the server is up and answering.
export async function GET() {
  return Response.json({ ok: true });
}
