"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function AlertsPage() {
  const [rows, setRows] = useState<{ pid: string; name: string; level: string; text: string }[]>([]);
  const [err, setErr] = useState("");
  useEffect(() => {
    api.alerts().then(setRows).catch((e: Error) => setErr(e.message));
  }, []);
  return (
    <div className="grid gap-3">
      <h1 className="text-xl sm:text-2xl font-bold">Clinical alerts & safety</h1>
      <p className="text-sm text-slate-500">Rule-based hints only. Always verify clinically. Informational vs warning distinguished. Document review rationale in encounter notes.</p>
      {err && <div className="card border-red-300 bg-red-50 text-sm text-red-800">DB error: {err}</div>}
      {!err && rows.length === 0 && <div className="card text-sm">No alerts. 🎉</div>}
      {rows.map((r, i) => (
        <Link key={i} href={`/patients/${r.pid}`} className={`card border-l-4 ${r.level === "warning" ? "border-l-red-500" : "border-l-amber-400"}`}>
          <div className="font-semibold text-sm">{r.name} <span className="font-mono text-xs text-slate-500">{r.pid}</span></div>
          <div className="text-sm mt-1">{r.text}</div>
        </Link>
      ))}
    </div>
  );
}
