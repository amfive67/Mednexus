"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { AuditLog } from "@/lib/types";

export default function AuditPage() {
  const [rows, setRows] = useState<AuditLog[]>([]);
  const [err, setErr] = useState("");
  useEffect(() => {
    api.audits().then((r) => setRows(r as AuditLog[])).catch((e: Error) => setErr(e.message));
  }, []);
  return (
    <div className="grid gap-3">
      <h1 className="text-xl sm:text-2xl font-bold">Global audit trail ({rows.length})</h1>
      {err && <div className="card border-red-300 bg-red-50 text-sm text-red-800">DB error: {err}</div>}
      <div className="card table-wrap"><table className="data">
        <thead><tr><th>When</th><th>Patient</th><th>Actor</th><th>Action</th><th>Entity</th><th>Detail</th></tr></thead>
        <tbody>{rows.map((a) => (
          <tr key={a.id}><td className="font-mono text-xs whitespace-nowrap">{String(a.at).slice(0, 16).replace("T", " ")}</td>
          <td><Link className="underline font-mono text-xs" href={`/patients/${a.patientId}`}>{a.patientId}</Link></td>
          <td>{a.actor}</td><td>{a.action}</td><td>{a.entity}</td><td>{a.detail}</td></tr>
        ))}</tbody>
      </table></div>
    </div>
  );
}
