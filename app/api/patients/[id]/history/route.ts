import { ALL_STAFF, CLINICAL, requireRole } from "@/lib/auth";
import { err, logAudit, prisma } from "@/lib/db";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireRole(req, ALL_STAFF);
    if (auth instanceof Response) return auth;
    const pid = decodeURIComponent(params.id);
    const [surgeries, allergies, familyHistory, preventive] = await Promise.all([
      prisma.surgery.findMany({ where: { patientId: pid }, orderBy: { createdAt: "desc" } }),
      prisma.allergy.findMany({ where: { patientId: pid }, orderBy: { createdAt: "desc" } }),
      prisma.familyHistory.findMany({ where: { patientId: pid }, orderBy: { createdAt: "desc" } }),
      prisma.preventive.findMany({ where: { patientId: pid }, orderBy: { createdAt: "desc" } }),
    ]);
    return Response.json({ surgeries, allergies, familyHistory, preventive });
  } catch (e) { return err(String(e)); }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const pid = decodeURIComponent(params.id);
    const b = await req.json();
    const auth = await requireRole(req, CLINICAL);
    if (auth instanceof Response) return auth;
    const actor = `${auth.displayName} (${auth.role})`;
    const kind = String(b.kind ?? "");
    let row: { id: string };
    if (kind === "surgery") {
      if (!b.procedureName?.trim()) return err("Procedure required", 400);
      row = await prisma.surgery.create({
        data: {
          patientId: pid, procedureName: String(b.procedureName).trim(), date: String(b.date ?? ""),
          dateStatus: b.dateStatus ?? "confirmed", location: String(b.location ?? ""), reason: String(b.reason ?? ""),
          surgeon: String(b.surgeon ?? ""), preopFindings: String(b.preopFindings ?? ""),
          operativeNotes: String(b.operativeNotes ?? ""), complications: String(b.complications ?? ""),
          outcome: String(b.outcome ?? ""), createdBy: actor,
        },
      });
      await logAudit(pid, actor, "create", "surgery", row.id, String(b.procedureName));
    } else if (kind === "allergy") {
      if (!b.substance?.trim()) return err("Substance required", 400);
      row = await prisma.allergy.create({
        data: {
          patientId: pid, substance: String(b.substance).trim(), reaction: String(b.reaction ?? ""),
          severity: String(b.severity ?? ""), date: String(b.date ?? ""), dateStatus: b.dateStatus ?? "not_remembered",
          source: String(b.source ?? "patient-reported"), verification: b.verification ?? "pending_verification",
          notes: String(b.notes ?? ""), createdBy: actor,
        },
      });
      await logAudit(pid, actor, "create", "allergy", row.id, String(b.substance));
    } else if (kind === "family") {
      if (!b.condition?.trim()) return err("Condition required", 400);
      row = await prisma.familyHistory.create({
        data: {
          patientId: pid, relation: String(b.relation ?? ""), condition: String(b.condition),
          onsetAge: String(b.onsetAge ?? ""), onsetStatus: b.onsetStatus ?? "unknown",
          verification: b.verification ?? "pending_verification", createdBy: actor,
        },
      });
      await logAudit(pid, actor, "create", "familyHistory", row.id, `${b.relation}: ${b.condition}`);
    } else if (kind === "preventive") {
      if (!b.title?.trim()) return err("Title required", 400);
      row = await prisma.preventive.create({
        data: {
          patientId: pid, kind: String(b.kind2 ?? "checkup"), title: String(b.title).trim(),
          date: String(b.date ?? ""), dateStatus: b.dateStatus ?? "confirmed",
          details: String(b.details ?? ""), dueDate: String(b.dueDate ?? ""),
          done: !!b.done, createdBy: actor,
        },
      });
      await logAudit(pid, actor, "create", "preventive", row.id, String(b.title));
    } else {
      return err("Unknown kind: use surgery | allergy | family | preventive", 400);
    }
    return Response.json(row, { status: 201 });
  } catch (e) { return err(String(e)); }
}
