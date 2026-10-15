import { ALL_STAFF, requireRole } from "@/lib/auth";
import { err, prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const auth = await requireRole(req, ALL_STAFF);
    if (auth instanceof Response) return auth;
    const pid = new URL(req.url).searchParams.get("patientId");
    const rows = await prisma.auditLog.findMany({
      where: pid ? { patientId: pid } : {},
      orderBy: { at: "desc" }, take: 200,
    });
    return Response.json(rows);
  } catch (e) { return err(String(e)); }
}
