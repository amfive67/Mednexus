# MediLifetime — Lifetime Patient Medical Record & Intelligence System

Production-ready, responsive (mobile / laptop / desktop), Vercel-deployable. No billing, per spec.

## Tech stack
- **Language:** TypeScript + SQL
- **Frontend:** Next.js 14 (App Router) + React 18 + Tailwind CSS
- **Database:** PostgreSQL (all records + audit trail) via Prisma — see `SETUP_POSTGRES.md`
- **Production path:** PostgreSQL (Neon/Vercel Postgres) via `prisma/schema.prisma` + S3 for documents + Auth.js/Keycloak + Redis alerts
- **AI:** record-based summarizer in `lib/clinical.ts` (no fabrication; LLM-pluggable)

## Run locally
```bash
npm install
npm run dev
# open http://localhost:3000
```

## Push to GitHub + deploy on Vercel
```bash
git init
git add -A
git commit -m "MediLifetime v1"
git branch -M main
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```
Then in Vercel: Add New Project → Import repo → Framework preset **Next.js** → Build `npm run build` → Deploy. No env vars needed for demo.

For production DB later, add in Vercel env:
- `DATABASE_URL` (Vercel Postgres / Neon)
- `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`
- `AUTH_SECRET`

## Features covered (§ prompt.txt)
Registration + duplicate check, flexible field statuses, conditions, medications, encounters, vitals, investigations + uploads, surgeries, allergies, family, preventive/follow-ups, lifetime timeline + filters, search by ID/name/phone, returning-patient workflow, missing-info panel, clinical alerts, audit trail, role switcher, AI record-based summary, responsive UI.

## Notes
- Missing ≠ negative everywhere (`FieldStatus` enum).
- Uploads are stored as base64 in Postgres (≤3MB enforced in UI) — use S3 for larger files in production.
- Replace demo auth (`/login`, localStorage) with Auth.js + MFA for real deployment. ABDM/ABHA + FHIR mapping stub-ready.
