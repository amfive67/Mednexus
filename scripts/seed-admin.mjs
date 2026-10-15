// Creates/updates the initial staff accounts. Sign-in is staff ID + name (no passwords).
// Usage: npm run db:seed-admin
import fs from "node:fs";
try {
  const txt = fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  for (const line of txt.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i > 0) {
      let k = t.slice(0, i).trim();
      let v = t.slice(i + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      if (!process.env[k]) process.env[k] = v;
    }
  }
} catch {}
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const accounts = [
  { username: "doctor", displayName: "Dr. Khusbu" },
];

for (const a of accounts) {
  await prisma.staffUser.upsert({
    where: { username: a.username },
    update: { displayName: a.displayName, role: "doctor", active: true },
    create: { username: a.username, displayName: a.displayName, passwordHash: "", role: "doctor" },
  });
  console.log(`${a.username} / ${a.displayName} (doctor) ready`);
}
await prisma.$disconnect();
