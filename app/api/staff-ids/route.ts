import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function dbHint(e: unknown): string {
  const code = (e as { code?: string })?.code ?? "";
  if (code === "P1000") return "code P1000: username/password rejected — reset the DB password and update DATABASE_URL.";
  if (code === "P1001") return "code P1001: host unreachable — DATABASE_URL host is wrong or the database is paused/deleted.";
  if (code === "P1002" || code === "P1017") return `code ${code}: connection timed out — the database may be waking up; wait 30s and reload.`;
  if (code === "P2021" || code === "P2022") return `code ${code}: tables missing — run 'prisma migrate deploy' against this database.`;
  return "the database did not respond — check DATABASE_URL and that the database is running.";
}

// Public: active doctor IDs + names for the one-tap sign-in picker. No secrets.
export async function GET() {
  try {
    const rows = await prisma.staffUser.findMany({
      where: { active: true },
      select: { username: true, displayName: true, role: true },
      orderBy: { username: "asc" },
    });
    return Response.json(rows);
  } catch (e) {
    return Response.json(
      { error: `Database unavailable — ${dbHint(e)}` },
      { status: 503 }
    );
  }
}
