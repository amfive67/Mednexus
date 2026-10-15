"use client";
import { useEffect, useState } from "react";

interface U { id: string; username: string; displayName: string; role: string; active: boolean; }

async function call(url: string, init?: RequestInit) {
  const r = await fetch(url, { credentials: "same-origin", ...init, headers: { "Content-Type": "application/json" } });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error ?? `Failed (${r.status})`);
  return d;
}

export default function UsersPage() {
  const [users, setUsers] = useState<U[]>([]);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [f, setF] = useState({ username: "", name: "" });

  const load = () => call("/api/users").then(setUsers).catch((e: Error) => setErr(e.message));
  useEffect(() => { load(); }, []);

  const create = async () => {
    setErr(""); setMsg("");
    try {
      await call("/api/users", { method: "POST", body: JSON.stringify({ username: f.username, displayName: f.name }) });
      setMsg(`Doctor account '${f.username}' created — they sign in with this ID + their name.`);
      setF({ username: "", name: "" });
      load();
    } catch (e) { setErr((e as Error).message); }
  };
  const patch = async (id: string, body: Record<string, unknown>, what: string) => {
    setErr(""); setMsg("");
    try { await call("/api/users", { method: "PATCH", body: JSON.stringify({ id, ...body }) }); setMsg(what); load(); }
    catch (e) { setErr((e as Error).message); }
  };
  const rename = (u: U) => {
    const name = prompt(`Full name for ${u.username}:`, u.displayName);
    if (name && name.trim()) patch(u.id, { displayName: name.trim() }, `Name updated for ${u.username}.`);
  };

  return (
    <div className="grid gap-4 max-w-4xl">
      <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-pine-950">Doctor accounts</h1>
      <p className="-mt-2 text-sm text-stone-500">Each doctor gets their own staff ID. They sign in with ID + name — no shared accounts.</p>
      {err && <div className="alert-warn">{err} (Non-admins see this page as forbidden.)</div>}
      {msg && <div className="alert-info !bg-emerald-50 !border-emerald-200 !text-emerald-900">{msg}</div>}
      <div className="card">
        <h2 className="section-title">Add a doctor</h2>
        <div className="grid sm:grid-cols-3 gap-2 mt-2">
          <div><label className="label">Staff ID *</label><input className="input" value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} placeholder="e.g. dr.rahul" /></div>
          <div><label className="label">Full name *</label><input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="e.g. Dr. Rahul Patel" /></div>
          <div className="flex items-end"><button className="btn-primary w-full" onClick={create}>Create doctor login</button></div>
        </div>
      </div>
      <div className="card table-wrap"><table className="data">
        <thead><tr><th>Username</th><th>Name</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>{users.map((u) => (
          <tr key={u.id}>
            <td className="font-mono text-xs">{u.username}</td><td>{u.displayName}</td><td>{u.role}</td>
            <td>{u.active ? "active" : "disabled"}</td>
            <td className="whitespace-nowrap">
              <button className="text-xs font-bold text-emerald-800 underline mr-2" onClick={() => rename(u)}>Rename</button>
              <button className="text-xs font-bold text-rose-700 underline" onClick={() => patch(u.id, { active: !u.active }, `${u.username} ${u.active ? "disabled" : "enabled"}.`)}>
                {u.active ? "Disable" : "Enable"}
              </button>
            </td>
          </tr>
        ))}</tbody>
      </table></div>
    </div>
  );
}
