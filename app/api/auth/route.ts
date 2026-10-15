export const dynamic = "force-dynamic";

import { getSession, signSession, sessionCookie, clearCookie } from "@/lib/auth";
import { err, prisma } from "@/lib/db";

// Doctors-only sign-in: staff ID + full name must match the doctor's own
// account (case-insensitive). Each doctor has a separate account.
export async function POST(req: Request) {
  try {
    const { staffId, name } = await req.json();
    if (!staffId || !String(name).trim()) return err("Staff ID and full name are required", 400);
    const u = await prisma.staffUser.findUnique({ where: { username: String(staffId).trim().toLowerCase() } });
    if (!u || !u.active || u.displayName.trim().toLowerCase() !== String(name).trim().toLowerCase())
      return err("Staff ID and name do not match any doctor account.", 401);
    const token = await signSession({ id: u.id, username: u.username, displayName: u.displayName, role: u.role });
    return Response.json(
      { ok: true, user: { username: u.username, displayName: u.displayName, role: u.role } },
      { headers: { "Set-Cookie": sessionCookie(token) } }
    );
  } catch (e) { return err(String(e)); }
}

export async function GET(req: Request) {
  const s = await getSession(req);
  if (!s) return Response.json({ user: null });
  return Response.json({ user: { username: s.username, displayName: s.displayName, role: s.role } });
}

export async function DELETE() {
  return Response.json({ ok: true }, { headers: { "Set-Cookie": clearCookie } });
}
