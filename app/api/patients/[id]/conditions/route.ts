import { ALL_STAFF, CLINICAL, requireRole } from "@/lib/auth";
import { err, logAudit, prisma } from "@/lib/db";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireRole(req, ALL_STAFF);
    if (auth instanceof Response) return auth;
    const rows = await prisma.condition.findMany({ where: { patientId: decodeURIComponent(params.id) }, orderBy: { createdAt: "desc" } });
    return Response.json(rows);
  } catch (e) { return err(String(e)); }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const pid = decodeURIComponent(params.id);
    const b = await req.json();
    if (!b.name?.trim()) return err("Condition name required", 400);
    const auth = await requireRole(req, CLINICAL);
    if (auth instanceof Response) return auth;
    const actor = `${auth.displayName} (${auth.role})`;
    const row = await prisma.condition.create({
      data: {
        patientId: pid, name: String(b.name).trim(), icdHint: String(b.icdHint ?? ""),
        onsetDate: String(b.onsetDate ?? ""), onsetStatus: b.onsetStatus ?? "unknown",
        diagnosedDate: String(b.diagnosedDate ?? ""), symptoms: String(b.symptoms ?? ""),
        cause: String(b.cause ?? ""), causeStatus: b.causeStatus ?? "unknown",
        examFindings: String(b.examFindings ?? ""), provisionalDx: String(b.provisionalDx ?? ""),
        confirmedDx: String(b.confirmedDx ?? b.name ?? ""), differentials: String(b.differentials ?? ""),
        severity: String(b.severity ?? ""), status: String(b.status ?? "active"),
        complications: String(b.complications ?? ""), treatmentPlan: String(b.treatmentPlan ?? ""),
        response: String(b.response ?? ""), notes: String(b.notes ?? ""), createdBy: actor,
      },
    });
    await logAudit(pid, actor, "create", "condition", row.id, row.name);
    return Response.json(row, { status: 201 });
  } catch (e) { return err(String(e)); }
}
