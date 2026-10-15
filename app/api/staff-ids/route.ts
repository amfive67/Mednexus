import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

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
      { error: "Database unavailable. Start PostgreSQL and set DATABASE_URL, then restart." },
      { status: 503 }
    );
  }
}
