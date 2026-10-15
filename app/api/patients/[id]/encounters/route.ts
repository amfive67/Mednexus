export const dynamic = "force-dynamic";

import { ALL_STAFF, CLINICAL, requireRole } from "@/lib/auth";
import { err, logAudit, prisma } from "@/lib/db";

const pick = (b: Record<string, unknown>) => ({
  dateTime: String(b.dateTime ?? ""), facility: String(b.facility ?? ""), department: String(b.department ?? ""),
  doctor: String(b.doctor ?? ""), reason: String(b.reason ?? ""), chiefComplaint: String(b.chiefComplaint ?? ""),
  symptoms: String(b.symptoms ?? ""), vitals: String(b.vitals ?? ""), examFindings: String(b.examFindings ?? ""),
  provisionalDx: String(b.provisionalDx ?? ""), finalDx: String(b.finalDx ?? ""), finalDxStatus: (b.finalDxStatus as "confirmed") ?? "confirmed",
  investigationsOrdered: String(b.investigationsOrdered ?? ""), treatment: String(b.treatment ?? ""),
  procedures: String(b.procedures ?? ""), followUpDate: String(b.followUpDate ?? ""),
  notes: String(b.notes ?? ""), outcome: String(b.outcome ?? ""), finalized: b.finalized !== false,
});

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireRole(req, ALL_STAFF);
    if (auth instanceof Response) return auth;
    const rows = await prisma.encounter.findMany({ where: { patientId: decodeURIComponent(params.id) }, orderBy: { dateTime: "desc" } });
    return Response.json(rows);
  } catch (e) { return err(String(e)); }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const pid = decodeURIComponent(params.id);
    const b = await req.json();
    if (!b.reason && !b.chiefComplaint) return err("Reason or chief complaint required", 400);
    const auth = await requireRole(req, CLINICAL);
    if (auth instanceof Response) return auth;
    const actor = `${auth.displayName} (${auth.role})`;
    const row = await prisma.encounter.create({ data: { ...pick(b), patientId: pid, createdBy: actor } });
    await logAudit(pid, actor, "create", "encounter", row.id, `${row.dateTime} ${row.department}: ${row.finalDx || row.reason}`);
    return Response.json(row, { status: 201 });
  } catch (e) { return err(String(e)); }
}
