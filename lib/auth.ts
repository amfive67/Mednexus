import { jwtVerify, SignJWT } from "jose";
import { prisma } from "./db";

export interface Session {
  id: string;
  username: string;
  displayName: string;
  role: string;
}

const COOKIE = "ml_session";
function getSecret(): Uint8Array {
  const v = process.env.AUTH_SECRET;
  if (!v && process.env.NODE_ENV === "production")
    throw new Error("AUTH_SECRET is missing. Set a long random string in .env.local (or Vercel env) and restart.");
  if (v && v.length < 32 && process.env.NODE_ENV === "production")
    throw new Error("AUTH_SECRET is too short (min 32 chars). Generate a longer value and restart.");
  return new TextEncoder().encode(v ?? "dev-only-insecure-secret-change-me");
}
const secret = getSecret;

export async function signSession(s: Session): Promise<string> {
  return new SignJWT({ ...s })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(secret());
}

function cookiesOf(req: Request): Map<string, string> {
  const m = new Map<string, string>();
  for (const part of (req.headers.get("cookie") ?? "").split(";")) {
    const i = part.indexOf("=");
    if (i > 0) m.set(part.slice(0, i).trim(), decodeURIComponent(part.slice(i + 1).trim()));
  }
  return m;
}

export async function getSession(req: Request): Promise<Session | null> {
  const token = cookiesOf(req).get(COOKIE);
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    const u = await prisma.staffUser.findUnique({ where: { id: String(payload.id) } });
    if (!u || !u.active) return null;
    return { id: u.id, username: u.username, displayName: u.displayName, role: u.role };
  } catch {
    return null;
  }
}

// Returns session or a 401/403 Response. Roles: which staff roles may proceed.
export async function requireRole(req: Request, roles: string[]): Promise<Session | Response> {
  const s = await getSession(req);
  if (!s) return Response.json({ error: "Not signed in. Please log in." }, { status: 401 });
  if (!roles.includes(s.role)) return Response.json({ error: `Role '${s.role}' is not allowed here.` }, { status: 403 });
  return s;
}

export const ALL_STAFF = ["doctor", "nurse", "reception", "specialist", "admin"];
export const CLINICAL = ["doctor", "nurse", "specialist", "admin"];
export const SENIOR = ["doctor", "admin"];
export const DOCTOR_ONLY = ["doctor"];

const FIELD_STATUSES = new Set([
  "confirmed", "unknown", "not_remembered", "not_provided",
  "not_recorded", "not_applicable", "pending_verification", "other",
]);
export function coerceStatus(v: unknown, fallback = "unknown"): string {
  const s = String(v ?? fallback);
  return FIELD_STATUSES.has(s) ? s : fallback;
}

export const sessionCookie = (token: string) =>
  `${COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=43200${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;

const secureFlag = process.env.NODE_ENV === "production" ? "; Secure" : "";
export const clearCookie = `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secureFlag}`;
