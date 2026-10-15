"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { api, type SessionUser } from "@/lib/api";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/patients", label: "Patients" },
  { href: "/patients/new", label: "+ Register" },
  { href: "/alerts", label: "Alerts" },
  { href: "/audit", label: "Audit" },
  { href: "/users", label: "Staff" },
];

const roleColor: Record<string, string> = {
  doctor: "bg-emerald-700 text-white border-emerald-700",
  nurse: "bg-teal-50 text-teal-800 border-teal-200",
  reception: "bg-amber-50 text-amber-900 border-amber-200",
  specialist: "bg-emerald-50 text-emerald-800 border-emerald-200",
  admin: "bg-stone-800 text-white border-stone-800",
};

export default function Nav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  useEffect(() => {
    api.me().then((d) => setUser(d.user)).catch(() => setUser(null));
  }, [path]);
  const chip = roleColor[user?.role ?? ""] ?? "bg-stone-100 text-stone-500 border-stone-200";

  const switchDoctor = async () => {
    await api.logout().catch(() => {});
    setUser(null);
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-emerald-900/10">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
        <Link href="/" className="flex items-center gap-2.5 font-extrabold tracking-tight">
          <span className="h-9 w-9 grid place-items-center rounded-2xl bg-gradient-to-br from-emerald-600 to-pine-800 text-white text-lg shadow-clinical" aria-hidden>✚</span>
          <span className="text-[15px] sm:text-lg text-pine-950">MediLifetime
            <span className="hidden sm:inline text-emerald-900/50 font-semibold"> • Lifetime Records</span>
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-1" aria-label="Primary">
          {links.map((l) => (
            <Link key={l.href} href={l.href}
              className={`px-3.5 py-2.5 rounded-2xl text-sm font-bold transition ${path === l.href ? "bg-emerald-700 text-white shadow-clinical" : "text-stone-600 hover:bg-emerald-50 hover:text-emerald-900"}`}>
              {l.label}
            </Link>
          ))}
          {user ? (
            <>
              <span className={`ml-2 text-xs badge ${chip}`}>{user.displayName}</span>
              <button onClick={switchDoctor} className="text-xs font-bold text-stone-500 hover:text-emerald-800 px-2 py-2">⇄ Switch</button>
            </>
          ) : null}
        </nav>
        <div className="md:hidden flex items-center gap-2">
          {user && <span className={`text-[11px] badge ${chip} max-w-[150px] truncate`}>{user.displayName} ({user.role})</span>}
          <button aria-label="Toggle menu" aria-expanded={open} onClick={() => setOpen(!open)} className="btn-ghost !px-3.5">{open ? "✕" : "☰"}</button>
        </div>
      </div>
      {open && (
        <nav className="md:hidden border-t border-emerald-900/10 bg-white px-3 py-2 grid gap-1" aria-label="Mobile">
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
              className={`px-3.5 py-3 rounded-2xl text-sm font-bold ${path === l.href ? "bg-emerald-700 text-white" : "text-stone-700 hover:bg-emerald-50"}`}>
              {l.label}
            </Link>
          ))}
          {user
            ? <button onClick={() => { setOpen(false); switchDoctor(); }} className="px-3.5 py-3 rounded-2xl text-sm font-bold text-left text-emerald-800">⇄ Switch doctor ({user.displayName})</button>
            : null}
        </nav>
      )}
    </header>
  );
}
