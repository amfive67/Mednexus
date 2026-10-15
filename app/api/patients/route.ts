import { ALL_STAFF, coerceStatus, requireRole } from "@/lib/auth";
import { err, logAudit, prisma } from "@/lib/db";
import { validatePatientInput } from "@/lib/validate";

function patientIdGen() {
  return `PAT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
}

async function uniquePatientId(): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const id = patientIdGen();
    const exists = await prisma.patient.findUnique({ where: { id }, select: { id: true } });
    if (!exists) return id;
  }
  return `PAT-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}`;
}

export async function GET(req: Request) {
  try {
    const auth = await requireRole(req, ALL_STAFF);
    if (auth instanceof Response) return auth;
    const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
    const where = q
      ? { OR: [{ id: { contains: q, mode: "insensitive" as const } }, { fullName: { contains: q, mode: "insensitive" as const } }, { phone: { contains: q } }] }
      : {};
    const patients = await prisma.patient.findMany({ where, orderBy: { updatedAt: "desc" }, take: 100 });
    return Response.json(patients);
  } catch (e) {
    return err(String(e));
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireRole(req, ALL_STAFF);
    if (auth instanceof Response) return auth;
    const b = await req.json();
    const problems = validatePatientInput(b as Record<string, unknown>);
    if (problems.length) return err(problems.join(" "), 400);
    const actor = `${auth.displayName} (${auth.role})`;
    // Duplicate check: indexed queries only (no full-table scan)
    const digits = (s: string) => (s ?? "").replace(/\D/g, "");
    const phoneDigits = b.phone ? digits(String(b.phone)) : "";
    let dupes: { id: string; fullName: string; dob: string; phone: string }[] = [];
    if (phoneDigits.length >= 6) {
      dupes = await prisma.patient.findMany({
        where: { phone: { contains: phoneDigits.slice(-10) } },
        select: { id: true, fullName: true, dob: true, phone: true }, take: 10,
      });
      dupes = dupes.filter((p) => digits(p.phone) === phoneDigits);
    }
    if (!dupes.length && b.fullName && b.dob) {
      const same = await prisma.patient.findMany({
        where: { dob: String(b.dob) },
        select: { id: true, fullName: true, dob: true, phone: true }, take: 20,
      });
      dupes = same.filter((p) => p.fullName.trim().toLowerCase() === String(b.fullName).trim().toLowerCase());
    }
    if (dupes.length && !b.force) return Response.json({ duplicates: dupes }, { status: 409 });
    const patient = await prisma.patient.create({
      data: {
        id: await uniquePatientId(),
        fullName: String(b.fullName).trim(),
        dob: b.dob ?? "", age: Number(b.age) || 0,
        gender: b.gender ?? "", genderStatus: coerceStatus((b as Record<string, unknown>).genderStatus, "confirmed") as never,
        phone: b.phone ?? "", address: b.address ?? "", emergencyContact: b.emergencyContact ?? "",
        bloodGroup: b.bloodGroup ?? "", bloodGroupStatus: ((b as Record<string, unknown>).bloodGroupStatus ? coerceStatus((b as Record<string, unknown>).bloodGroupStatus) : (b.bloodGroup ? "confirmed" : "unknown")) as never,
        allergiesNote: b.allergiesNote ?? "", existingConditions: b.existingConditions ?? "",
        familyHistoryNote: b.familyHistoryNote ?? "", lifestyleRisks: b.lifestyleRisks ?? "",
        consent: !!b.consent, consentDate: b.consentDate ?? "",
        createdBy: actor,
      },
    });
    await logAudit(patient.id, actor, "create", "patient", patient.id, `Registered ${patient.fullName}`);
    return Response.json(patient, { status: 201 });
  } catch (e) {
    return err(String(e));
  }
}
