export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ ok: true, app: "MediLifetime", time: new Date().toISOString() });
}
