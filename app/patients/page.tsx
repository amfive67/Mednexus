"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Patient } from "@/lib/types";

export default function Patients() {
  const [q, setQ] = useState("");
  const [all, setAll] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = (query: string) => {
    setLoading(true);
    api.patients(query)
      .then((r) => { setAll(r as Patient[]); setErr(""); })
      .catch((e: Error) => setErr(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const t = setTimeout(() => load(q), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="grid gap-4">
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
        <h1 className="text-xl sm:text-2xl font-bold">Patient search</h1>
        <Link href="/patients/new" className="btn-primary">+ New registration</Link>
      </div>
      <input className="input" placeholder="Search by Patient ID, name, or phone…" value={q} onChange={(e) => setQ(e.target.value)} />
      {err && <div className="card border-red-300 bg-red-50 text-sm text-red-800">DB error: {err}. Check Postgres is running.</div>}
      {loading ? <div className="card text-sm text-slate-500">Loading from Postgres…</div> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {all.map((p) => (
            <Link key={p.id} href={`/patients/${p.id}`} className="card card-hover">
              <div className="flex items-center gap-2.5">
                <span className="h-10 w-10 shrink-0 grid place-items-center rounded-2xl bg-emerald-700 text-white font-extrabold" aria-hidden>
                  {p.fullName.trim().charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <div className="font-bold truncate">{p.fullName}</div>
                  <div className="text-xs text-stone-500 font-mono truncate">{p.id} • DOB {p.dob || "unknown"} • {p.gender}</div>
                </div>
              </div>
              <div className="text-sm text-stone-600 mt-2 truncate">{p.existingConditions || "No conditions recorded"}</div>
              <div className="mt-1.5"><span className="badge bg-emerald-50 text-emerald-800 border-emerald-200">🩸 {p.bloodGroup || String(p.bloodGroupStatus).replaceAll("_", " ")}</span></div>
            </Link>
          ))}
        </div>
      )}
      {!loading && !err && all.length === 0 && (
        <div className="card text-sm text-slate-500">
          No patients found. <Link href="/patients/new" className="btn-ghost text-sm ml-2 border">+ Register first patient</Link>
        </div>
      )}
    </div>
  );
}
