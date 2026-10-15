export const dynamic = "force-dynamic";

import { err, prisma } from "@/lib/db";

// First-run setup ONLY: creates the first doctor account when none exists.
// Returns 403 forever after — it cannot be reused to add accounts.
export async function POST(req: Request) {
  try {
    if ((await prisma.staffUser.count({ where: { active: true } })) > 0) return err("Setup is closed — accounts already exist.", 403);
    const { username, displayName } = await req.json();
    if (!username?.trim() || !displayName?.trim()) return err("Staff ID and full name are required", 400);
    const u = await prisma.staffUser.create({
      data: {
        username: String(username).trim().toLowerCase(),
        displayName: String(displayName).trim(),
        passwordHash: "",
        role: "doctor",
      },
    });
    return Response.json({ ok: true, username: u.username }, { status: 201 });
  } catch (e) {
    if (String(e).includes("Unique constraint")) return err("That staff ID is taken", 409);
    return err(String(e));
  }
}
