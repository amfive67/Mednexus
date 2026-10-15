import { SENIOR, requireRole } from "@/lib/auth";
import { err, logAudit, prisma } from "@/lib/db";

// DELETE /api/records/<entity>/<id> — entity: encounter|condition|medication|investigation|surgery|allergy|familyHistory|preventive
const models = {
  encounter: () => prisma.encounter,
  condition: () => prisma.condition,
  medication: () => prisma.medication,
  investigation: () => prisma.investigation,
  surgery: () => prisma.surgery,
  allergy: () => prisma.allergy,
  familyHistory: () => prisma.familyHistory,
  preventive: () => prisma.preventive,
} as const;

export async function DELETE(req: Request, { params }: { params: { entity: string; id: string } }) {
  try {
    const fn = models[params.entity as keyof typeof models];
    if (!fn) return err("Unknown entity", 400);
    const auth = await requireRole(req, SENIOR);
    if (auth instanceof Response) return auth;
    const actor = `${auth.displayName} (${auth.role})`;
    const existing = await (fn() as { findUnique: (a: unknown) => Promise<{ patientId: string } | null> }).findUnique({ where: { id: params.id } });
    if (!existing) return err("Record not found", 404);
    await (fn() as { delete: (a: unknown) => Promise<unknown> }).delete({ where: { id: params.id } });
    await logAudit(existing.patientId, actor, "delete", params.entity, params.id, "Record removed (audit retains stub)");
    return Response.json({ ok: true });
  } catch (e) { return err(String(e)); }
}
