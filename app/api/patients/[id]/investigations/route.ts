import { ALL_STAFF, CLINICAL, requireRole } from "@/lib/auth";
import { err, logAudit, prisma } from "@/lib/db";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireRole(req, ALL_STAFF);
    if (auth instanceof Response) return auth;
    const rows = await prisma.investigation.findMany({ where: { patientId: decodeURIComponent(params.id) }, orderBy: { date: "desc" } });
    return Response.json(rows);
  } catch (e) { return err(String(e)); }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireRole(req, CLINICAL);
    if (auth instanceof Response) return auth;
    const pid = decodeURIComponent(params.id);
    const b = await req.json();
    if (!b.type) return err("Report type required", 400);
    const fileDataUrl = String(b.fileDataUrl ?? "");
    if (fileDataUrl && fileDataUrl.length > 4_200_000) return err("File too large for database storage (use compressed PDF/image ≤3MB).", 413);
    if (fileDataUrl && !/^data:(application\/pdf|image\/(png|jpeg|gif|webp));base64,/.test(fileDataUrl)) return err("Only PDF or image uploads are allowed.", 400);
    const actor = `${auth.displayName} (${auth.role})`;
    const row = await prisma.investigation.create({
      data: {
        patientId: pid, type: String(b.type), date: String(b.date ?? ""),
        source: String(b.source ?? ""), findings: String(b.findings ?? ""),
        interpretation: String(b.interpretation ?? ""), relatedDiagnosis: String(b.relatedDiagnosis ?? ""),
        orderedBy: String(b.orderedBy ?? ""), encounterId: String(b.encounterId ?? ""),
        fileName: String(b.fileName ?? ""), fileDataUrl: String(b.fileDataUrl ?? ""), createdBy: actor,
      },
    });
    await logAudit(pid, actor, "create", "investigation", row.id, `${row.type} ${row.date}`);
    return Response.json(row, { status: 201 });
  } catch (e) { return err(String(e)); }
}
