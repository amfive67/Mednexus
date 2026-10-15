export const dynamic = "force-dynamic";

import { requireRole } from "@/lib/auth";
import { err, prisma } from "@/lib/db";

// Doctors-only staff management. Every account is an individual doctor login
// (staff ID + operator name, no shared accounts).
export async function GET(req: Request) {
  const auth = await requireRole(req, ["doctor"]);
  if (auth instanceof Response) return auth;
  const users = await prisma.staffUser.findMany({
    select: { id: true, username: true, displayName: true, role: true, active: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  return Response.json(users);
}

export async function POST(req: Request) {
  const auth = await requireRole(req, ["doctor"]);
  if (auth instanceof Response) return auth;
  try {
    const { username, displayName } = await req.json();
    if (!username?.trim() || !displayName?.trim()) return err("Staff ID and name are required", 400);
    const u = await prisma.staffUser.create({
      data: {
        username: String(username).trim().toLowerCase(),
        displayName: String(displayName).trim(),
        passwordHash: "",
        role: "doctor",
      },
      select: { id: true, username: true, displayName: true, role: true, active: true, createdAt: true },
    });
    return Response.json(u, { status: 201 });
  } catch (e) {
    if (String(e).includes("Unique constraint")) return err("Username already exists", 409);
    return err(String(e));
  }
}

export async function PATCH(req: Request) {
  const auth = await requireRole(req, ["doctor"]);
  if (auth instanceof Response) return auth;
  try {
    const { id, displayName, active } = await req.json();
    if (!id) return err("User id required", 400);
    const data: Record<string, unknown> = { role: "doctor" };
    if (typeof displayName === "string" && displayName.trim()) data.displayName = displayName.trim();
    if (typeof active === "boolean") {
      if (id === auth.id && active === false) return err("You cannot deactivate your own account", 400);
      if (active === false) {
        const activeCount = await prisma.staffUser.count({ where: { active: true } });
        if (activeCount <= 1) return err("Cannot disable the last active doctor — hospital would be locked out.", 400);
      }
      data.active = active;
    }
    const u = await prisma.staffUser.update({
      where: { id }, data,
      select: { id: true, username: true, displayName: true, role: true, active: true, createdAt: true },
    });
    return Response.json(u);
  } catch (e) { return err(String(e)); }
}
