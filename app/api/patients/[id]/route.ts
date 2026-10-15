import { ALL_STAFF, CLINICAL, coerceStatus, requireRole } from "@/lib/auth";
import { err, logAudit, prisma } from "@/lib/db";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireRole(req, ALL_STAFF);
    if (auth instanceof Response) return auth;
    const pid = decodeURIComponent(params.id);
    const patient = await prisma.patient.findUnique({
      where: { id: pid },
      include: {
        conditions: { orderBy: { createdAt: "desc" } },
        medications: { orderBy: { createdAt: "desc" } },
        encounters: { orderBy: { dateTime: "desc" } },
        investigations: { orderBy: { date: "desc" } },
        surgeries: { orderBy: { createdAt: "desc" } },
        allergies: { orderBy: { createdAt: "desc" } },
        familyHistory: { orderBy: { createdAt: "desc" } },
        preventive: { orderBy: { createdAt: "desc" } },
        audits: { orderBy: { at: "desc" }, take: 200 },
      },
    });
    if (!patient) return err("Patient not found", 404);
    return Response.json(patient);
  } catch (e) {
    return err(String(e));
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const pid = decodeURIComponent(params.id);
    const auth = await requireRole(req, CLINICAL);
    if (auth instanceof Response) return auth;
    const b = await req.json();
    const actor = `${auth.displayName} (${auth.role})`;
    const allowed = ["fullName","dob","age","gender","genderStatus","phone","address","emergencyContact","bloodGroup","bloodGroupStatus","allergiesNote","existingConditions","familyHistoryNote","lifestyleRisks","consent","consentDate"] as const;
    const data: Record<string, unknown> = {};
    for (const k of allowed) if (k in b) data[k] = b[k];
    if ("genderStatus" in data) data.genderStatus = coerceStatus(data.genderStatus, "unknown");
    if ("bloodGroupStatus" in data) data.bloodGroupStatus = coerceStatus(data.bloodGroupStatus, "unknown");
    if ("fullName" in data && !String(data.fullName).trim()) return err("Full name cannot be blank.", 400);
    if ("phone" in data && String(data.phone).replace(/\D/g,"").length < 10 && String(data.phone).trim() !== "") return err("Phone must be a valid 10-digit mobile number.", 400);
    const patient = await prisma.patient.update({ where: { id: pid }, data: { ...data, updatedAt: new Date() } });
    await logAudit(pid, actor, "update", "patient", pid, "Profile updated");
    return Response.json(patient);
  } catch (e) {
    return err(String(e));
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireRole(req, ["doctor"]);
    if (auth instanceof Response) return auth;
    return err("Patient deletion is disabled to protect lifetime records and audit trail. Contact admin to archive.", 403);
  } catch (e) {
    return err(String(e));
  }
}
