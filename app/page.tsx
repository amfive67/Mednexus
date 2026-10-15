"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const ICONS = ["🩺", "📋", "🦠", "💊", "🧪", "⚠️"];

export default function Home() {
  const [stats, setStats] = useState({ p: 0, e: 0, c: 0, m: 0, i: 0, a: 0 });
  const [dbDown, setDbDown] = useState(false);
  const [docName, setDocName] = useState("");
  const reload = () => {
    api.stats().then(setStats).catch(() => setDbDown(true));
    api.me().then((d) => { if (d.user) setDocName(d.user.displayName); }).catch(() => {});
  };
  useEffect(reload, []);
  const cards = [
    { n: "Patients", v: stats.p, h: "/patients", d: "Persistent ID, duplicates review" },
    { n: "Encounters", v: stats.e, h: "/patients", d: "Every visit preserved separately" },
    { n: "Conditions", v: stats.c, h: "/patients", d: "Evolving disease histories" },
    { n: "Medications", v: stats.m, h: "/patients", d: "Purpose, changes, outcomes" },
    { n: "Investigations", v: stats.i, h: "/patients", d: "Compare values over time" },
    { n: "Allergy alerts", v: stats.a, h: "/alerts", d: "Safety warnings, overdue follow-ups" },
  ];
  return (
    <div className="grid gap-4">
      <div className="hero p-6 sm:p-10">
        <div className="relative z-10">
          <span className="badge bg-white/10 text-emerald-100 border-white/20 mb-3">✚ Lifetime medical intelligence</span>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight max-w-2xl">Every patient&apos;s complete medical story, in one calm view.</h1>
          <p className="mt-3 text-emerald-100/90 text-sm sm:text-base max-w-2xl">
            One persistent profile per patient. Every visit, disease, medication, test, surgery and allergy connected across decades.
            Missing ≠ negative. Every change traceable. No billing in this system.
          </p>
          <div className="mt-5 flex flex-col sm:flex-row gap-2.5">
            <Link href="/patients/new" className="btn bg-white text-pine-900 hover:bg-emerald-50 px-6 font-extrabold">+ Register patient</Link>
            <Link href="/patients" className="btn border border-white/30 text-white hover:bg-white/10 px-6">Search by Patient ID / name</Link>
          </div>
        </div>
      </div>
      {dbDown && (
        <div className="alert-warn !border-rose-300">
          Cannot reach Postgres. Start it and set <code>DATABASE_URL</code> in <code>.env.local</code>, then restart <code>npm run dev</code>. See <code>SETUP_POSTGRES.md</code>.
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div className="card card-hover">
          <div className="flex items-start justify-between">
            <div className="text-xl sm:text-2xl font-extrabold tracking-tight text-pine-950">Doctor</div>
            <span className="text-xl" aria-hidden>🩺</span>
          </div>
          <div className="text-xs text-stone-500">Signed-in role</div>
        </div>
        <div className="card card-hover !border-emerald-700/30">
          <div className="flex items-start justify-between">
            <div className="text-xl sm:text-2xl font-extrabold tracking-tight text-emerald-900 truncate">{docName || "…"}</div>
            <span className="text-xl" aria-hidden>👤</span>
          </div>
          <div className="text-xs text-stone-500">Logged-in doctor (from your sign-in)</div>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {cards.map((c, i) => (
          <Link key={c.n} href={c.h} className="card card-hover">
            <div className="flex items-start justify-between">
              <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-pine-950">{c.v}</div>
              <span className="text-xl" aria-hidden>{ICONS[i % ICONS.length]}</span>
            </div>
            <div className="font-bold text-sm sm:text-base mt-1">{c.n}</div>
            <div className="text-xs text-stone-500">{c.d}</div>
          </Link>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <div className="card">
          <h2 className="section-title"><span aria-hidden className="text-emerald-700">↩</span>Returning-patient workflow</h2>
          <ol className="text-sm text-stone-600 list-decimal ml-5 mt-2 grid gap-1.5">
            <li>Search by Patient ID → verify identity</li>
            <li>Open overview + timeline, review allergies & current meds</li>
            <li>Create new encounter — never overwrite history</li>
            <li>Fill gaps marked Unknown / Pending verification</li>
          </ol>
        </div>
        <div className="card">
          <h2 className="section-title"><span aria-hidden className="text-emerald-700">📖</span>Audit & safety</h2>
          <p className="text-sm text-stone-600 mt-2">Every record is audit-logged with actor + timestamp. Review the full trail anytime.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/audit" className="btn-ghost text-sm">View audit trail</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
