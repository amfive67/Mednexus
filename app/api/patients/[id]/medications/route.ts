export const dynamic = "force-dynamic";

import { ALL_STAFF, CLINICAL, requireRole } from "@/lib/auth";
import { err, logAudit, prisma } from "@/lib/db";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireRole(req, ALL_STAFF);
    if (auth instanceof Response) return auth;
    const rows = await prisma.medication.findMany({ where: { patientId: decodeURIComponent(params.id) }, orderBy: { createdAt: "desc" } });
    return Response.json(rows);
  } catch (e) { return err(String(e)); }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const pid = decodeURIComponent(params.id);
    const b = await req.json();
    if (!b.medicineName?.trim()) return err("Medicine name required", 400);
    const auth = await requireRole(req, CLINICAL);
    if (auth instanceof Response) return auth;
    const actor = `${auth.displayName} (${auth.role})`;
    const row = await prisma.medication.create({
      data: {
        patientId: pid, medicineName: String(b.medicineName).trim(), genericName: String(b.genericName ?? ""),
        dosage: String(b.dosage ?? ""), frequency: String(b.frequency ?? ""), route: String(b.route ?? ""),
        duration: String(b.duration ?? ""), reason: String(b.reason ?? ""),
        relatedDiagnosis: String(b.relatedDiagnosis ?? ""), medStatus: String(b.medStatus ?? "current"),
        changeReason: String(b.changeReason ?? ""), startDate: String(b.startDate ?? ""),
        endDate: String(b.endDate ?? ""), endStatus: b.endStatus ?? "confirmed",
        prescribedBy: String(b.prescribedBy ?? ""), prescriptionDate: String(b.prescriptionDate ?? ""),
        sideEffects: String(b.sideEffects ?? ""), effectiveness: String(b.effectiveness ?? ""),
        adherence: String(b.adherence ?? ""), createdBy: actor,
      },
    });
    await logAudit(pid, actor, "create", "medication", row.id, `${row.medicineName} ${row.dosage} [${row.medStatus}]`);
    return Response.json(row, { status: 201 });
  } catch (e) { return err(String(e)); }
}
