"use client";
import { FIELD_STATUS_LABELS, type FieldStatus } from "@/lib/types";

// Status badges: icon + text, never color-alone (accessibility).
export function StatusBadge({ value }: { value?: string }) {
  if (!value) return <span className="badge bg-stone-100 text-stone-500 border-stone-200">—</span>;
  const danger = ["active", "uncontrolled", "discontinued"].includes(value);
  const warn = ["pending_verification", "unknown", "unverified", "not_recorded", "not_remembered", "other"].includes(value);
  const ok = ["confirmed", "controlled", "resolved", "current"].includes(value);
  const cls = danger ? "bg-rose-50 text-rose-800 border-rose-200"
    : warn ? "bg-amber-50 text-amber-900 border-amber-200"
    : ok ? "bg-emerald-50 text-emerald-800 border-emerald-200"
    : "bg-stone-100 text-stone-600 border-stone-200";
  const icon = danger ? "▲" : warn ? "●" : ok ? "✓" : "○";
  return <span className={`badge ${cls}`}><span aria-hidden>{icon}</span>{value.replaceAll("_", " ")}</span>;
}

export function FieldInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input className="input" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export function FieldArea({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="label">{label}</label>
      <textarea className="input min-h-[76px]" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

// Short, clinic-friendly status set. DB still accepts older values already stored.
export const SIMPLE_STATUSES: FieldStatus[] = ["confirmed", "unknown", "pending_verification", "not_recorded"];

// Context-sensitive status selector + free-text note pattern (§3)
export function StatusSelect({ label, value, onChange, options }: { label: string; value: FieldStatus; onChange: (v: FieldStatus) => void; options?: FieldStatus[] }) {
  const opts: FieldStatus[] = options ?? SIMPLE_STATUSES;
  return (
    <div>
      <label className="label">{label}</label>
      <select className="input" value={value} onChange={(e) => onChange(e.target.value as FieldStatus)}>
        {opts.map((o) => <option key={o} value={o}>{FIELD_STATUS_LABELS[o]}</option>)}
      </select>
    </div>
  );
}

export function SectionTitle({ icon, children }: { icon?: string; children: React.ReactNode }) {
  return <h2 className="section-title">{icon && <span aria-hidden className="text-emerald-700">{icon}</span>}{children}</h2>;
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <div className="card text-sm text-stone-500 border-dashed !bg-emerald-50/40 text-center py-6">{children}</div>;
}
