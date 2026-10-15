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

export const err = (message: string, status = 500) =>
  Response.json({ error: message }, { status });
