"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FieldInput, FieldArea, StatusSelect } from "@/components/ui";
import { api } from "@/lib/api";
import { todayLocal } from "@/lib/dates";
import { validatePatientInput } from "@/lib/validate";
import type { FieldStatus, Patient } from "@/lib/types";

export default function NewPatient() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "", dob: "", gender: "", genderStatus: "confirmed" as FieldStatus,
    phone: "", address: "", emergencyContact: "", bloodGroup: "", bloodGroupStatus: "unknown" as FieldStatus,
    allergiesNote: "", existingConditions: "", consent: true,
  });
  const [dupes, setDupes] = useState<Patient[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: string | boolean | FieldStatus) => {
    const nf = { ...form, [k]: v } as typeof form;
    setForm(nf);
    setErrors([]);
    if (["fullName", "dob", "phone"].includes(k) && (nf.fullName || nf.phone)) {
      api.patients(nf.phone || nf.fullName).then((r) => {
        const n = nf.fullName.trim().toLowerCase();
        setDupes((r as Patient[]).filter((p) =>
          (nf.phone && p.phone.replace(/\D/g, "") === nf.phone.replace(/\D/g, "") && nf.phone.replace(/\D/g, "").length >= 6) ||
          (n && nf.dob && p.fullName.trim().toLowerCase() === n && p.dob === nf.dob)
        ).slice(0, 5));
      }).catch(() => {});
    }
  };
  const age = form.dob ? Math.max(0, Math.floor((Date.now() - new Date(form.dob + "T00:00:00").getTime()) / 3.15576e10)) || 0 : 0;

  const submit = async (force = false) => {
    const problems = validatePatientInput({ ...form, fullName: form.fullName.trim() });
    if (problems.length && !force) { setErrors(problems); window.scrollTo({ top: 0 }); return; }
    setSaving(true);
    try {
      const p = await api.createPatient({
        ...form, fullName: form.fullName.trim(), age: age || 0,
        consentDate: form.consent ? todayLocal() : "", force,
      });
      router.push(`/patients/${(p as Patient).id}`);
    } catch (e) {
      const er = e as Error & { status?: number; duplicates?: Patient[] };
      if (er.status === 409 && er.duplicates && !force) {
        setDupes(er.duplicates as Patient[]);
        if (confirm(`Possible duplicate found (${(er.duplicates as Patient[]).map((d) => d.id).join(", ")}). Register anyway?`)) {
          await submit(true);
          return;
        }
      } else if (er.status === 400) {
        setErrors([er.message]);
        window.scrollTo({ top: 0 });
      } else {
        alert(er.message);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto grid gap-4">
      <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-pine-950">Patient registration</h1>
      {errors.length > 0 && (
        <div className="alert-warn">
          <b>Please fix the following:</b>
          <ul className="list-disc ml-5 mt-1">{errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
        </div>
      )}
      {dupes.length > 0 && (
        <div className="card border-amber-300 bg-amber-50 text-sm">
          <b>Possible duplicates — review before merging:</b>
          {dupes.map((d) => <div key={d.id}>• {d.fullName} — {d.id} — DOB {d.dob} — {d.phone} (<a className="underline" href={`/patients/${d.id}`}>open</a>)</div>)}
          <div className="text-xs mt-1">Never auto-merge records belonging to different people.</div>
        </div>
      )}
      <div className="card grid sm:grid-cols-2 gap-3">
        <FieldInput label="Full name *" value={form.fullName} onChange={(v) => set("fullName", v)} placeholder="As per ID proof" />
        <div><label className="label">Date of birth * {age ? `(~${age}y)` : ""}</label>
          <input type="date" className="input" value={form.dob} max={todayLocal()} onChange={(e) => set("dob", e.target.value)} /></div>
        <div><label className="label">Gender *</label>
          <select className="input" value={form.gender} onChange={(e) => set("gender", e.target.value)}>
            <option value="">Select…</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select></div>
        <StatusSelect label="Gender info status" value={form.genderStatus} onChange={(v) => set("genderStatus", v)} />
        <FieldInput label="Mobile number *" value={form.phone} onChange={(v) => set("phone", v)} placeholder="10-digit mobile" />
        <FieldInput label="Emergency contact *" value={form.emergencyContact} onChange={(v) => set("emergencyContact", v)} placeholder="Name + mobile number" />
        <div className="sm:col-span-2"><FieldInput label="Address *" value={form.address} onChange={(v) => set("address", v)} placeholder="House, street, city" /></div>
        <FieldInput label="Blood group" value={form.bloodGroup} onChange={(v) => set("bloodGroup", v)} placeholder="e.g. B+ (optional)" />
        <StatusSelect label="Blood group status" value={form.bloodGroupStatus} onChange={(v) => set("bloodGroupStatus", v)} />
        <div className="sm:col-span-2"><FieldArea label="Known allergies" value={form.allergiesNote} onChange={(v) => set("allergiesNote", v)} placeholder="'No known allergies' or describe the allergy" /></div>
        <div className="sm:col-span-2"><FieldArea label="Existing conditions" value={form.existingConditions} onChange={(v) => set("existingConditions", v)} placeholder="Ongoing diseases, past treatments" /></div>
      </div>
      <label className="card flex gap-2 items-start text-sm">
        <input type="checkbox" checked={form.consent} onChange={(e) => set("consent", e.target.checked)} className="mt-1 h-5 w-5 accent-emerald-700" />
        <span><b>Patient consent *</b> — required to store medical records.</span>
      </label>
      <button className="btn-primary w-full sm:w-auto disabled:opacity-50" disabled={saving} onClick={() => submit(false)}>
        {saving ? "Saving…" : "Save registration"}
      </button>
    </div>
  );
}
