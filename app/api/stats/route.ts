export const dynamic = "force-dynamic";

import { ALL_STAFF, requireRole } from "@/lib/auth";
import { err, prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const auth = await requireRole(req, ALL_STAFF);
    if (auth instanceof Response) return auth;
    const [patients, encounters, conditions, medications, investigations, allergies] = await Promise.all([
      prisma.patient.count(), prisma.encounter.count(), prisma.condition.count(),
      prisma.medication.count(), prisma.investigation.count(), prisma.allergy.count(),
    ]);
    return Response.json({ p: patients, e: encounters, c: conditions, m: medications, i: investigations, a: allergies });
  } catch (e) { return err(String(e)); }
}
