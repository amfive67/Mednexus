// Loads .env.local then runs prisma CLI (prisma ignores .env.local by default).
import { spawnSync } from "node:child_process";
import fs from "node:fs";
const envPath = new URL("../.env.local", import.meta.url);
try {
  const txt = fs.readFileSync(envPath, "utf8");
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
const args = process.argv.slice(2);
const r = spawnSync("npx", ["prisma", ...args], { stdio: "inherit", shell: true });
process.exit(r.status ?? 1);
