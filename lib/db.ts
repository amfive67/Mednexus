import { PrismaClient } from "@prisma/client";

const g = globalThis as unknown as { __prisma?: PrismaClient };

export const prisma = g.__prisma ?? new PrismaClient();

if (!g.__prisma) g.__prisma = prisma;

export async function logAudit(patientId: string, actor: string, action: string, entity: string, entityId: string, detail = "") {
  try {
    await prisma.auditLog.create({ data: { patientId, actor, action, entity, entityId, detail } });
  } catch (e) {
    console.error("audit log failed (record kept):", String(e).slice(0, 300));
  }
}

export const err = (message: string, status = 500) => {
  // Never leak DB/engine internals to the screen in production.
  // Useful validation messages (400/401/403/404/409) always pass through.
  const safe =
    status === 500 && process.env.NODE_ENV === "production"
      ? "Something went wrong on the server. Please try again. If it continues, contact support."
      : message;
  if (status === 500) console.error("API 500:", String(message).slice(0, 500));
  return Response.json({ error: safe }, { status });
};
