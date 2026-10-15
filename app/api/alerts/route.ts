export const dynamic = "force-dynamic";

import { ALL_STAFF, requireRole } from "@/lib/auth";
import { clinicalAlerts } from "@/lib/clinical";
import { err, prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const auth = await requireRole(req, ALL_STAFF);
    if (auth instanceof Response) return auth;
    const patients = await prisma.patient.findMany({
      include: { allergies: true, medications: true, conditions: true, encounters: true },
      take: 200,
    });
    const rows = patients.flatMap((p) =>
      clinicalAlerts(p as never, p.allergies as never, p.medications as never, p.conditions as never, p.encounters as never)
        .map((a) => ({ pid: p.id, name: p.fullName, level: a.level, text: a.text }))
    );
    return Response.json(rows);
  } catch (e) { return err(String(e)); }
}
