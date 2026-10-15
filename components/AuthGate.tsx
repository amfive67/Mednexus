"use client";
import { useEffect, useState } from "react";
import { api, type SessionUser } from "@/lib/api";
import DoctorLogin from "@/components/DoctorLogin";

// Gate: signed-out visitors get the normal doctor sign-in form (or the
// first-run setup form when no accounts exist yet). Signed-in doctors
// pass straight through to the site.
export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null | undefined>(undefined);
  const [netErr, setNetErr] = useState("");
  const load = () => {
    setNetErr("");
    api.me().then((d) => setUser(d.user)).catch((e: Error) => {
      if (String(e.message).toLowerCase().includes("fetch") || String(e.message).includes("503") || String(e.message).includes("Database"))
        { setNetErr("Cannot reach server/database. Start PostgreSQL, check DATABASE_URL, restart with npm start."); setUser(null); }
      else setUser(null);
    });
  };
  useEffect(() => { load(); }, []);
  if (user === undefined) return <div className="card text-sm text-stone-500 text-center py-10">Opening MediLifetime…</div>;
  if (!user) return (<><DoctorLogin onDone={load} />{netErr && <div className="max-w-md mx-auto mt-3 alert-warn">{netErr}</div>}</>);
  return <>{children}</>;
}
