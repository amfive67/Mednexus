# PostgreSQL setup — MediLifetime (Neon free tier recommended for India + Vercel)

Demo runs on browser localStorage so it deploys with zero config.
Follow this when you need real multi-user / hospital-wide storage.

## 0. Bugs fixed in this patch
- Deep-link / refresh on `/patients/[id]` showed "not found" because seed ran only on Home. Now `seedIfNeeded()` runs on detail page too.
- Encounter form merged `chiefComplaint+symptoms` and `treatment+notes` into one textarea, corrupting data on save. Now 4 separate fields.
- Storage-quota crash on large uploads now shows a clear alert instead of silent failure.
- If you see a different bug, send the page URL + exact error text / screenshot and I will patch it.

## 1. Create free Postgres (Neon)
1. Go to https://neon.tech → Sign up → New Project → name `medilifetime`, region `Asia Pacific (Mumbai)` if available.
2. Copy the **pooled connection string**, e.g.
   `postgresql://alex:xxxx@ep-xxx.ap-south-1.aws.neon.tech/medilifetime?sslmode=require`
3. Alternative: Vercel Dashboard → Storage → Create Postgres, or Supabase → New project → Connect → pooled URL.

## 2. Wire it locally
```powershell
cd D:\meta
copy .env.example .env.local
# edit .env.local, paste your DATABASE_URL
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run build
npm run dev
```

What this does:
- `prisma/schema.prisma` already defines Patient, Condition, Medication, Encounter, Investigation, Surgery, Allergy, AuditLog with `FieldStatus` enum (missing ≠ negative).
- `migrate dev` creates those tables in your Neon DB.
- `lib/db.ts` gives you a cached `PrismaClient` used by all API routes.

## 3. Verify DB connection
```powershell
npx prisma studio
# opens http://localhost:5555 — you should see empty tables.
```
Or run: `npx prisma db pull` should succeed with no error.

## 4. Deploy on Vercel with DB
1. Push to GitHub, Import in Vercel.
2. Vercel → Project → Settings → Environment Variables → add `DATABASE_URL` (same Neon string, Production + Preview).
3. Redeploy. Then one-time migration against production DB from your laptop:
```powershell
$env:DATABASE_URL="paste-production-url-here"
npx prisma migrate deploy
```

## 5. Migrating demo data → Postgres (when ready)
- Export: DevTools → Application → Local Storage → copy `lmrs.*` keys, or add an Export button.
- Import via `prisma studio` or a small `app/api/migrate/route.ts` that loops `prisma.patient.create()`.
- Files: move from base64 localStorage to S3 (`S3_BUCKET`, keys) and store only the URL in `Investigation.fileUrl`.

## Troubleshooting
- `P1001 can't reach database`: IP allow-list / wrong host — use pooled (`-pooler`) host from Neon, keep `?sslmode=require`.
- `P1000 auth failed`: password has special chars — wrap in URL-encode or regenerate password.
- Vercel build OK but runtime "Postgres not configured": `DATABASE_URL` missing in Production env or you forgot Redeploy after adding it.
- `localStorage quota`: expected with base64 scans — move to Postgres+S3 per §5.
