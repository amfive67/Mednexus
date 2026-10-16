"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

// Normal doctor sign-in form: staff ID + full name must match the doctor's own
// account. First ever run (zero accounts) shows the create-first-doctor form.
export default function DoctorLogin({ onDone }: { onDone: () => void }) {
  const [ids, setIds] = useState<{ username: string; displayName: string }[]>([]);
  const [staffId, setStaffId] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [firstRun, setFirstRun] = useState(false);

  useEffect(() => {
    fetch("/api/staff-ids")
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error((d as { error?: string }).error ?? `Server error (${r.status})`);
        return d;
      })
      .then((d) => {
        if (Array.isArray(d)) {
          setIds(d);
          if (d.length === 0) setFirstRun(true);
          else setStaffId(d[0].username);
        } else {
          setErr("Unexpected server response. Please reload.");
        }
      })
      .catch(() => setErr("Cannot reach the server. Check your internet connection and reload the page."));
  }, []);

  const submit = async () => {
    const sid = staffId.trim().toLowerCase();
    if (!sid || !name.trim()) { setErr("Enter your staff ID and full name."); return; }
    setBusy(true); setErr("");
    try {
      await api.login(sid, name.trim());
      onDone();
    } catch (e) { setErr((e as Error).message + " Check ID + name spelling (name match is case-insensitive)."); }
    finally { setBusy(false); }
  };

  const createFirst = async () => {
    if (!staffId.trim() || !name.trim()) { setErr("Enter a staff ID and your full name."); return; }
    setBusy(true); setErr("");
    try {
      const r = await fetch("/api/setup", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: staffId.trim(), displayName: name.trim() }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Setup failed");
      await api.login(staffId.trim(), name.trim());
      onDone();
    } catch (e) { setErr((e as Error).message); }
    finally { setBusy(false); }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="hero p-6 text-center mb-4">
        <div className="relative z-10">
          <div className="text-3xl" aria-hidden>✚</div>
          <h1 className="text-xl font-extrabold tracking-tight mt-1">
            {firstRun ? "Welcome — create your doctor account" : "Doctor sign in"}
          </h1>
          <p className="text-emerald-100/80 text-sm">
            {firstRun ? "First run: this creates the first doctor login" : "Hospital doctors only — every action is audit-logged"}
          </p>
        </div>
      </div>
      <div className="card">
        {err && <div className="alert-warn mb-3">{err}</div>}
        <label className="label">Staff ID</label>
        {!firstRun && ids.length > 0 ? (
          <select className="input" value={staffId} onChange={(e) => setStaffId(e.target.value)}>
            {ids.map((i) => <option key={i.username} value={i.username}>{i.username}</option>)}
          </select>
        ) : (
          <input className="input" value={staffId} onChange={(e) => setStaffId(e.target.value)} placeholder="e.g. dr.rahul" />
        )}
        <label className="label mt-3">Full name</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") firstRun ? createFirst() : submit(); }}
          placeholder="e.g. Dr. Rahul Patel" />
        <button className="btn-primary w-full mt-4 disabled:opacity-50" disabled={busy}
          onClick={firstRun ? createFirst : submit}>
          {busy ? "Please wait…" : firstRun ? "Create account & enter →" : "Sign in →"}
        </button>
      </div>
    </div>
  );
}
