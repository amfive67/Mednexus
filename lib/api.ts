// Client-side REST helper — talks to /api/* (Postgres). Session cookie auth.
// On 401 the user is sent back to /login.
import type { Allergy, AuditLog, Condition, Encounter, FamilyEntry, Investigation, Medication, Patient, Preventive, Surgery } from "./types";

async function req<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, { credentials: "same-origin", ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    if (r.status === 401 && typeof window !== "undefined" && !url.includes("/api/auth")) {
      window.location.href = "/";
    }
    const e = new Error((data as { error?: string }).error ?? `Request failed (${r.status})`) as Error & { status: number; duplicates?: unknown };
    e.status = r.status;
    if ((data as { duplicates?: unknown }).duplicates) e.duplicates = (data as { duplicates?: unknown }).duplicates;
    throw e;
  }
  return data as T;
}

export interface SessionUser { username: string; displayName: string; role: string; }

export const api = {
  stats: () => req<{ p: number; e: number; c: number; m: number; i: number; a: number }>("/api/stats"),
  patients: (q = "") => req<Patient[]>(`/api/patients${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  createPatient: (b: Record<string, unknown>) => req<Patient>("/api/patients", { method: "POST", body: JSON.stringify(b) }),
  bundle: (id: string) => req<Bundle>(`/api/patients/${encodeURIComponent(id)}`),
  post: (pid: string, coll: "encounters" | "conditions" | "medications" | "investigations", b: Record<string, unknown>) =>
    req(`/api/patients/${encodeURIComponent(pid)}/${coll}`, { method: "POST", body: JSON.stringify(b) }),
  postHistory: (pid: string, b: Record<string, unknown>) =>
    req(`/api/patients/${encodeURIComponent(pid)}/history`, { method: "POST", body: JSON.stringify(b) }),
  del: (entity: string, id: string) => req(`/api/records/${entity}/${id}`, { method: "DELETE" }),
  alerts: () => req<{ pid: string; name: string; level: string; text: string }[]>("/api/alerts"),
  audits: (patientId?: string) => req<AuditLog[]>(`/api/audit${patientId ? `?patientId=${encodeURIComponent(patientId)}` : ""}`),
  login: (staffId: string, name: string) =>
    req<{ ok: boolean; user: SessionUser }>("/api/auth", { method: "POST", body: JSON.stringify({ staffId, name }) }),
  me: () => req<{ user: SessionUser | null }>("/api/auth"),
  logout: () => req<{ ok: boolean }>("/api/auth", { method: "DELETE" }),
};

export interface Bundle {
  id: string; fullName: string; dob: string; age: number; gender: string;
  genderStatus: string; phone: string; address: string; emergencyContact: string;
  bloodGroup: string; bloodGroupStatus: string; allergiesNote: string;
  existingConditions: string; familyHistoryNote: string; lifestyleRisks: string;
  consent: boolean; consentDate: string;
  conditions: Condition[]; medications: Medication[]; encounters: Encounter[];
  investigations: Investigation[]; surgeries: Surgery[]; allergies: Allergy[];
  familyHistory: FamilyEntry[]; preventive: Preventive[]; audits: AuditLog[];
}
