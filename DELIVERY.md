# MediLifetime — Hospital Delivery Handover (v1.0)

## Run it (stable, hospital use)
```powershell
cd D:\meta
npm install
npm run build    # once (also after any update)
npm start        # → http://localhost:3000  — production server, no dev-cache errors
```
Requires: Node 20+, PostgreSQL 18 running, `.env.local` with `DATABASE_URL` and `AUTH_SECRET`.
Use `npm run dev` only while developing. Never run `npm run build` while any server is running.

## First-day checklist
1. Open the site and sign in with your doctor ID + full name (e.g. ID `doctor`, name `Dr. Khusbu`). The dashboard shows `Doctor | <your name>` from your account.
2. Staff page → add one ID per doctor (e.g. `dr.rahul` / `Dr. Rahul Patel`). On a brand-new database, the first screen creates the first doctor.
3. Change `AUTH_SECRET` in `.env.local` to a long random string, then restart the app.
4. `npm run backup` — confirm `backups/medilifetime-*.dump` appears. Schedule it nightly (Task Scheduler → `npm run backup` in D:\meta).
5. Delete any test/demo patients you don't want.

## Security model
- Doctors only: normal sign-in form (staff ID + full name must match the doctor's own account). No shared accounts.
- Sessions are signed JWTs in httpOnly cookies, 12h expiry. All `/api/*` routes require a valid session.
- Headers: X-Frame-Options DENY, nosniff, no camera/mic/geolocation. Run behind HTTPS in production.

## Known limits (say these out loud at handover)
- Alerts are rule-based hints, not certified decision support — doctors must verify.
- Uploads ≤3MB stored in DB; move to S3/object storage as scan volume grows.
- Single-server deployment; no ABDM/ABHA integration yet; backups are local (copy off-site weekly).
