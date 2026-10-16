"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { StatusBadge, FieldInput, FieldArea, StatusSelect } from "@/components/ui";
import { aiSummary, clinicalAlerts, missingReport } from "@/lib/clinical";
import { api, type Bundle } from "@/lib/api";
import { displayDate, displayDateTime, nowLocalInput, todayLocal } from "@/lib/dates";
import type { FieldStatus, TimelineItem } from "@/lib/types";

const TABS = ["Overview", "Timeline", "Encounters", "Conditions", "Medications", "Tests & Docs", "History & Preventive", "AI Summary", "Audit"] as const;

export default function Detail({ params }: { params: { id: string } }) {
  const pid = decodeURIComponent(params.id);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [err, setErr] = useState("");
  const [timelineFilter, setTimelineFilter] = useState("");
  const [timelineKind, setTimelineKind] = useState("all");
  const [doctorName, setDoctorName] = useState("");

  const refresh = () => {
    api.bundle(pid).then((b) => { setBundle(b); setErr(""); }).catch((e: Error) => setErr(e.message));
  };
  useEffect(refresh, [pid]);
  useEffect(() => {
    fetch("/api/auth", { credentials: "same-origin" }).then((r) => r.json())
      .then((d) => { if (d.user?.displayName) setDoctorName(d.user.displayName); })
      .catch(() => {});
  }, []);

  if (err && !bundle) return <div className="card text-sm text-red-800 border-red-300 bg-red-50">DB error: {err}. <Link className="underline" href="/patients">Back</Link></div>;
  if (!bundle) return <div className="card text-sm text-slate-500">Loading lifetime record from Postgres…</div>;

  const patient = bundle as unknown as Parameters<typeof clinicalAlerts>[0];
  const conds = bundle.conditions as unknown as Parameters<typeof clinicalAlerts>[3];
  const meds = bundle.medications as unknown as Parameters<typeof clinicalAlerts>[2];
  const encs = bundle.encounters as unknown as Parameters<typeof clinicalAlerts>[4];
  const invs = bundle.investigations;
  const surgs = bundle.surgeries;
  const algs = bundle.allergies as unknown as Parameters<typeof clinicalAlerts>[1];

  const alerts = clinicalAlerts(patient, algs, meds, conds, encs);
  const missing = missingReport(
    patient as never, conds as never, meds as never,
    encs as never, invs as never, algs as never
  );

  const timeline: TimelineItem[] = [
    ...bundle.encounters.map((e) => ({ id: e.id, date: (e.dateTime || "").slice(0, 10), kind: "encounter", title: `Visit — ${e.department} (${e.doctor})`, detail: e.finalDx || e.provisionalDx || e.reason, link: "Encounters" })),
    ...bundle.conditions.map((c) => ({ id: c.id, date: (c.diagnosedDate || c.onsetDate || "").slice(0, 10), kind: "condition", title: `Diagnosis — ${c.name}`, detail: `${c.status}; cause: ${c.cause || c.causeStatus}`, link: "Conditions" })),
    ...bundle.medications.map((m) => ({ id: m.id, date: (m.startDate || m.prescriptionDate || "").slice(0, 10), kind: "medication", title: `Rx — ${m.medicineName} ${m.dosage}`, detail: `${m.medStatus}; ${m.reason}`, link: "Medications" })),
    ...bundle.investigations.map((i) => ({ id: i.id, date: (i.date || "").slice(0, 10), kind: "investigation", title: `Test — ${i.type}`, detail: i.findings, link: "Tests & Docs" })),
    ...bundle.surgeries.map((s) => ({ id: s.id, date: (s.date || "").slice(0, 10), kind: "surgery", title: `Surgery — ${s.procedureName}`, detail: s.outcome || s.reason, link: "History & Preventive" })),
    ...bundle.allergies.map((a) => ({ id: a.id, date: (a.date || "").slice(0, 10), kind: "allergy", title: `Allergy — ${a.substance}`, detail: a.reaction, link: "History & Preventive" })),
  ].filter((t) => t.date && /^\d{4}-\d{2}-\d{2}/.test(t.date)).sort((a, b) => b.date.localeCompare(a.date))
    .filter((t) => (timelineKind === "all" || t.kind === timelineKind) && (!timelineFilter || (t.title + t.detail).toLowerCase().includes(timelineFilter.toLowerCase())));

  return (
    <div className="grid gap-4">
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold">{bundle.fullName}</h1>
              <span className="badge bg-emerald-700 text-white border-emerald-700 font-mono">{bundle.id}</span>
              <span className="badge bg-emerald-50 text-emerald-700 border-emerald-200">Postgres</span>
            </div>
            <div className="text-sm text-slate-600 mt-1">DOB {bundle.dob || "unknown"} ({bundle.age}y) • {bundle.gender} • Blood {bundle.bloodGroup || bundle.bloodGroupStatus.replaceAll("_", " ")} • {bundle.phone}</div>
            <div className="text-xs text-slate-500">{bundle.address} • Emergency: {bundle.emergencyContact || "—"}</div>
          </div>
          <div className="flex gap-2">
            <button className="btn-ghost text-sm" onClick={() => { navigator.clipboard?.writeText(bundle.id); alert("Patient ID copied"); }}>Copy ID</button>
            <Link href="/patients" className="btn-ghost text-sm">← All</Link>
          </div>
        </div>
        {alerts.length > 0 && (
          <div className="mt-3 grid gap-1">
            {alerts.map((a, i) => (
              <div key={i} className={a.level === "warning" ? "alert-warn" : "alert-info"}>⚠ {a.text}</div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 rail">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={tab === t ? "tab-active" : "tab-idle"}>{t}</button>
        ))}
      </div>

      {tab === "Overview" && <OverviewTab bundle={bundle} missing={missing} />}
      {tab === "Timeline" && (
        <div className="card">
          <div className="flex flex-col sm:flex-row gap-2 mb-3">
            <input className="input" placeholder="Filter timeline…" value={timelineFilter} onChange={(e) => setTimelineFilter(e.target.value)} />
            <select className="input sm:w-56" value={timelineKind} onChange={(e) => setTimelineKind(e.target.value)}>
              {["all", "encounter", "condition", "medication", "investigation", "surgery", "allergy"].map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
          <div className="grid gap-2">
            {timeline.map((t) => (
              <div key={t.id} className="flex gap-3 items-start border rounded-xl p-3">
                <div className="text-xs font-mono bg-emerald-50 text-emerald-900 border border-emerald-100 rounded-xl px-2.5 py-1 whitespace-nowrap font-bold">{t.date}</div>
                <div className="min-w-0">
                  <div className="font-semibold text-sm">{t.title} <StatusBadge value={t.kind} /></div>
                  <div className="text-sm text-slate-600 truncate sm:whitespace-normal">{t.detail}</div>
                </div>
              </div>
            ))}
            {timeline.length === 0 && <div className="text-sm text-slate-500">No events yet — add an encounter, condition, medication or test.</div>}
          </div>
        </div>
      )}
      {tab === "Encounters" && <EncounterTab bundle={bundle} defaultDoctor={doctorName} onChange={refresh} />}
      {tab === "Conditions" && <ConditionTab bundle={bundle} onChange={refresh} />}
      {tab === "Medications" && <MedicationTab bundle={bundle} defaultDoctor={doctorName} onChange={refresh} />}
      {tab === "Tests & Docs" && <TestsTab bundle={bundle} defaultDoctor={doctorName} onChange={refresh} />}
      {tab === "History & Preventive" && <HistoryTab bundle={bundle} onChange={refresh} />}
      {tab === "AI Summary" && (
        <div className="card">
          <h2 className="font-bold">AI-assisted history intelligence <span className="badge bg-purple-50 text-purple-700 border-purple-200 ml-1">record-based only</span></h2>
          <p className="text-xs text-slate-500 mt-1">Summarizes only what is recorded, links to source records, states gaps. Never invents causes or prescribes.</p>
          <pre className="mt-3 text-xs sm:text-sm whitespace-pre-wrap bg-slate-50 border rounded-xl p-3 font-mono">{
            aiSummary(bundle as never, bundle.conditions as never, bundle.medications as never, bundle.encounters as never, bundle.investigations as never)
          }</pre>
        </div>
      )}
      {tab === "Audit" && (
        <div className="card">
          <h2 className="font-bold mb-2">Audit trail — who / when / what ({bundle.audits.length})</h2>
          <div className="table-wrap"><table className="data">
            <thead><tr><th>When</th><th>Actor</th><th>Action</th><th>Entity</th><th>Detail</th></tr></thead>
            <tbody>{bundle.audits.map((a) => <tr key={a.id}><td className="whitespace-nowrap font-mono text-xs">{String(a.at).slice(0, 16).replace("T", " ")}</td><td>{a.actor}</td><td>{a.action}</td><td>{a.entity}</td><td>{a.detail}</td></tr>)}</tbody>
          </table></div>
        </div>
      )}
    </div>
  );
}

function OverviewTab({ bundle, missing }: { bundle: Bundle; missing: string[] }) {
  const meds = bundle.medications.filter((m) => m.medStatus === "current");
  const encs = bundle.encounters.slice(0, 3);
  return (
    <div className="grid lg:grid-cols-3 gap-3">
      <div className="card lg:col-span-2">
        <h2 className="font-bold mb-2">Active & historical diagnoses</h2>
        {bundle.conditions.length === 0 && <p className="text-sm text-slate-500">None recorded (≠ disease-free).</p>}
        {bundle.conditions.map((c) => <div key={c.id} className="border-b py-2 text-sm"><b>{c.name}</b> <StatusBadge value={c.status} /> <span className="text-slate-500">• onset {c.onsetDate || c.onsetStatus} • {c.treatmentPlan}</span></div>)}
        <h2 className="font-bold mt-4 mb-2">Current medications ({meds.length})</h2>
        {meds.map((m) => <div key={m.id} className="border-b py-2 text-sm"><b>{m.medicineName}</b> {m.dosage} {m.frequency} — {m.reason} <StatusBadge value={m.medStatus} /></div>)}
        {meds.length === 0 && <p className="text-sm text-slate-500">No current meds recorded. Do not assume previously prescribed meds are still taken.</p>}
        <h2 className="font-bold mt-4 mb-2">Recent visits</h2>
        {encs.map((e) => <div key={e.id} className="border-b py-2 text-sm">{displayDate(e.dateTime.slice(0, 10))} — {e.department} ({e.doctor}): {e.finalDx || e.reason}</div>)}
      </div>
      <div className="grid gap-3">
        <div className="card border-red-200">
          <h2 className="font-bold">Allergies</h2>
          {bundle.allergies.length === 0 && <p className="text-sm text-slate-500 mt-1">{bundle.allergiesNote || "Not recorded yet — distinct from 'No known allergies'."}</p>}
          {bundle.allergies.map((a) => <div key={a.id} className="text-sm mt-1"><b>{a.substance}</b> — {a.reaction} <StatusBadge value={a.verification} /></div>)}
          {bundle.allergiesNote && <div className="text-xs text-slate-500 mt-1">Note: {bundle.allergiesNote}</div>}
        </div>
        <div className="card border-amber-200 bg-amber-50/50">
          <h2 className="font-bold">Missing / unverified</h2>
          {missing.length === 0 ? <p className="text-sm text-emerald-700">Complete ✓</p> :
            <ul className="text-sm list-disc ml-5 mt-1">{missing.map((m, i) => <li key={i}>{m}</li>)}</ul>}
        </div>
      </div>
    </div>
  );
}

async function saveColl(pid: string, coll: "encounters" | "conditions" | "medications" | "investigations", body: Record<string, unknown>) {
  await api.post(pid, coll, body);
}

async function del(entity: string, id: string, onChange: () => void) {
  if (!confirm("Delete permanently? This removes the record and all data linked to it. This cannot be undone.")) return;
  await api.del(entity, id).catch((e: Error) => alert(e.message));
  onChange();
}

function EncounterTab({ bundle, defaultDoctor, onChange }: { bundle: Bundle; defaultDoctor: string; onChange: () => void }) {
  const pid = bundle.id;
  const [f, setF] = useState({ dateTime: nowLocalInput(), facility: "", department: "General Medicine", doctor: "", reason: "", chiefComplaint: "", symptoms: "", vitals: "", examFindings: "", provisionalDx: "", finalDx: "", finalDxStatus: "confirmed" as FieldStatus, investigationsOrdered: "", treatment: "", procedures: "", notes: "", followUpDate: "", outcome: "" });
  useEffect(() => { if (defaultDoctor) setF((p) => (p.doctor ? p : { ...p, doctor: defaultDoctor })); }, [defaultDoctor]);
  const save = async () => {
    if (!f.reason && !f.chiefComplaint) { alert("Reason or chief complaint required"); return; }
    try {
      await saveColl(pid, "encounters", f);
      onChange(); setF({ dateTime: nowLocalInput(), facility: "", department: "General Medicine", doctor: f.doctor, reason: "", chiefComplaint: "", symptoms: "", vitals: "", examFindings: "", provisionalDx: "", finalDx: "", finalDxStatus: "confirmed" as FieldStatus, investigationsOrdered: "", treatment: "", procedures: "", notes: "", followUpDate: "", outcome: "" });
    } catch (e) { alert((e as Error).message); }
  };
  return (
    <div className="grid lg:grid-cols-2 gap-3">
      <div className="card">
        <h2 className="font-bold mb-2">New encounter (incomplete can be saved)</h2>
        <div className="grid sm:grid-cols-2 gap-2">
          <div><label className="label">Date/time</label><input type="datetime-local" className="input" value={f.dateTime} onChange={(e) => setF({ ...f, dateTime: e.target.value })} /></div>
          <FieldInput label="Facility" value={f.facility} onChange={(v) => setF({ ...f, facility: v })} />
          <FieldInput label="Department" value={f.department} onChange={(v) => setF({ ...f, department: v })} />
          <FieldInput label="Doctor" value={f.doctor} onChange={(v) => setF({ ...f, doctor: v })} />
          <div className="sm:col-span-2"><FieldInput label="Reason for visit" value={f.reason} onChange={(v) => setF({ ...f, reason: v })} /></div>
          <div className="sm:col-span-2"><FieldArea label="Chief complaint (patient-reported)" value={f.chiefComplaint} onChange={(v) => setF({ ...f, chiefComplaint: v })} /></div>
          <div className="sm:col-span-2"><FieldArea label="Symptoms detail (onset, duration, severity)" value={f.symptoms} onChange={(v) => setF({ ...f, symptoms: v })} /></div>
          <div className="sm:col-span-2"><FieldInput label="Vitals (BP/HR/Temp/SpO2/Wt)" value={f.vitals} onChange={(v) => setF({ ...f, vitals: v })} placeholder="e.g. BP 138/86, HR 82, SpO2 98%" /></div>
          <div className="sm:col-span-2"><FieldArea label="Examination (clinician-observed)" value={f.examFindings} onChange={(v) => setF({ ...f, examFindings: v })} /></div>
          <FieldInput label="Provisional Dx" value={f.provisionalDx} onChange={(v) => setF({ ...f, provisionalDx: v })} />
          <FieldInput label="Final Dx" value={f.finalDx} onChange={(v) => setF({ ...f, finalDx: v })} />
          <StatusSelect label="Dx status" value={f.finalDxStatus} onChange={(v) => setF({ ...f, finalDxStatus: v })} />
          <div><label className="label">Follow-up date</label><input type="date" className="input" value={f.followUpDate} max="2100-12-31" onChange={(e) => setF({ ...f, followUpDate: e.target.value })} /></div>
          <div className="sm:col-span-2"><FieldArea label="Treatment decisions" value={f.treatment} onChange={(v) => setF({ ...f, treatment: v })} /></div>
          <div className="sm:col-span-2"><FieldArea label="Doctor notes / outcome" value={f.notes} onChange={(v) => setF({ ...f, notes: v })} /></div>
        </div>
        <button className="btn-primary mt-3 w-full" onClick={save}>Save encounter to Postgres</button>
      </div>
      <div className="grid gap-2 content-start">
        {bundle.encounters.map((e) => (
          <div key={e.id} className="card">
            <div className="flex justify-between gap-2"><b className="text-sm">{displayDateTime(e.dateTime)} — {e.department}</b>
              <button className="text-xs text-red-600" onClick={() => del("encounter", e.id, onChange)}>Delete</button></div>
            <div className="text-sm text-slate-600">{e.doctor} • {e.facility}</div>
            <div className="text-sm mt-1">Dx: {e.finalDx || e.provisionalDx || "—"} <StatusBadge value={e.finalDxStatus} /></div>
            <div className="text-sm text-slate-600">Vitals: {e.vitals || "—"}</div>
            <div className="text-sm text-slate-600">Rx: {e.treatment || "—"} • Follow-up: {e.followUpDate || "—"}</div>
            {e.notes && <div className="text-xs text-slate-500 mt-1">{e.notes}</div>}
          </div>
        ))}
        {bundle.encounters.length === 0 && <div className="card text-sm text-slate-500">No visits yet.</div>}
      </div>
    </div>
  );
}

function ConditionTab({ bundle, onChange }: { bundle: Bundle; onChange: () => void }) {
  const pid = bundle.id;
  const [f, setF] = useState({ name: "", diagnosedDate: "", onsetDate: "", onsetStatus: "unknown" as FieldStatus, symptoms: "", cause: "", causeStatus: "unknown" as FieldStatus, status: "active", treatmentPlan: "", response: "", notes: "" });
  const save = async () => {
    if (!f.name.trim()) { alert("Condition name required"); return; }
    try {
      await saveColl(pid, "conditions", { ...f, confirmedDx: f.name });
      onChange(); setF({ name: "", diagnosedDate: "", onsetDate: "", onsetStatus: "unknown" as FieldStatus, symptoms: "", cause: "", causeStatus: "unknown" as FieldStatus, status: "active", treatmentPlan: "", response: "", notes: "" });
    } catch (e) { alert((e as Error).message); }
  };
  return (
    <div className="grid lg:grid-cols-2 gap-3">
      <div className="card">
        <h2 className="font-bold mb-2">Add / update condition</h2>
        <div className="grid sm:grid-cols-2 gap-2">
          <div className="sm:col-span-2"><FieldInput label="Disease / condition *" value={f.name} onChange={(v) => setF({ ...f, name: v })} placeholder="e.g. Type 2 Diabetes Mellitus" /></div>
          <div><label className="label">Onset date</label><input type="date" className="input" value={f.onsetDate} max="2100-12-31" onChange={(e) => setF({ ...f, onsetDate: e.target.value })} /></div>
          <StatusSelect label="Onset status" value={f.onsetStatus} onChange={(v) => setF({ ...f, onsetStatus: v })} />
          <div><label className="label">Diagnosed date</label><input type="date" className="input" value={f.diagnosedDate} max="2100-12-31" onChange={(e) => setF({ ...f, diagnosedDate: e.target.value })} /></div>
          <div><label className="label">Current status</label><select className="input" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>{["active", "controlled", "uncontrolled", "resolved", "other"].map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
          <div className="sm:col-span-2"><FieldArea label="Symptoms / progression" value={f.symptoms} onChange={(v) => setF({ ...f, symptoms: v })} /></div>
          <div className="sm:col-span-2"><FieldInput label="Cause / risk factors (never invent)" value={f.cause} onChange={(v) => setF({ ...f, cause: v })} placeholder="Leave blank + Unknown if not established" /></div>
          <div className="sm:col-span-2"><StatusSelect label="Cause status" value={f.causeStatus} onChange={(v) => setF({ ...f, causeStatus: v })} /></div>
          <div className="sm:col-span-2"><FieldArea label="Treatment plan / response / notes" value={f.treatmentPlan} onChange={(v) => setF({ ...f, treatmentPlan: v })} /></div>
        </div>
        <button className="btn-primary mt-3 w-full" onClick={save}>Save condition</button>
      </div>
      <div className="grid gap-2 content-start">
        {bundle.conditions.map((c) => (
          <div key={c.id} className="card">
            <b className="text-sm">{c.name}</b> <StatusBadge value={c.status} />
            <div className="text-xs text-slate-500">Onset {c.onsetDate || c.onsetStatus} • Dx {c.diagnosedDate || "—"} • Cause: {c.cause || c.causeStatus}</div>
            <div className="text-sm mt-1">{c.treatmentPlan}</div>
            <button className="text-xs text-red-600 mt-1" onClick={() => del("condition", c.id, onChange)}>Delete</button>
          </div>
        ))}
        {bundle.conditions.length === 0 && <div className="card text-sm text-slate-500">No conditions recorded.</div>}
      </div>
    </div>
  );
}

function MedicationTab({ bundle, defaultDoctor, onChange }: { bundle: Bundle; defaultDoctor: string; onChange: () => void }) {
  const pid = bundle.id;
  const [f, setF] = useState({ medicineName: "", dosage: "", frequency: "OD", route: "Oral", reason: "", relatedDiagnosis: "", prescribedBy: "", prescriptionDate: todayLocal(), startDate: todayLocal(), endDate: "", medStatus: "current" as "current"|"historical"|"discontinued"|"unverified", changeReason: "", sideEffects: "", effectiveness: "" });
  useEffect(() => { if (defaultDoctor) setF((p) => (p.prescribedBy ? p : { ...p, prescribedBy: defaultDoctor })); }, [defaultDoctor]);
  const save = async () => {
    if (!f.medicineName.trim()) { alert("Medicine name required"); return; }
    try {
      await saveColl(pid, "medications", f);
      onChange(); setF({ medicineName: "", dosage: "", frequency: "OD", route: "Oral", reason: "", relatedDiagnosis: "", prescribedBy: f.prescribedBy, prescriptionDate: todayLocal(), startDate: todayLocal(), endDate: "", medStatus: "current" as "current"|"historical"|"discontinued"|"unverified", changeReason: "", sideEffects: "", effectiveness: "" });
    } catch (e) { alert((e as Error).message); }
  };
  return (
    <div className="grid lg:grid-cols-2 gap-3">
      <div className="card">
        <h2 className="font-bold mb-2">Prescribe / record medication</h2>
        <div className="grid sm:grid-cols-2 gap-2">
          <FieldInput label="Medicine *" value={f.medicineName} onChange={(v) => setF({ ...f, medicineName: v })} />
          <FieldInput label="Dosage" value={f.dosage} onChange={(v) => setF({ ...f, dosage: v })} placeholder="e.g. 500 mg" />
          <FieldInput label="Frequency" value={f.frequency} onChange={(v) => setF({ ...f, frequency: v })} placeholder="OD / BD / TDS" />
          <FieldInput label="Route" value={f.route} onChange={(v) => setF({ ...f, route: v })} />
          <div className="sm:col-span-2"><FieldInput label="Reason + related diagnosis" value={f.reason} onChange={(v) => setF({ ...f, reason: v })} /></div>
          <FieldInput label="Prescribed by" value={f.prescribedBy} onChange={(v) => setF({ ...f, prescribedBy: v })} />
          <div><label className="label">Status</label><select className="input" value={f.medStatus} onChange={(e) => setF({ ...f, medStatus: e.target.value as typeof f.medStatus })}>{["current", "historical", "discontinued", "unverified"].map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
          <div><label className="label">Prescription date</label><input type="date" className="input" value={f.prescriptionDate} max="2100-12-31" onChange={(e) => setF({ ...f, prescriptionDate: e.target.value })} /></div>
          <div><label className="label">Start date</label><input type="date" className="input" value={f.startDate} max="2100-12-31" onChange={(e) => setF({ ...f, startDate: e.target.value })} /></div>
          <div><label className="label">End date (blank = ongoing)</label><input type="date" className="input" value={f.endDate} max="2100-12-31" onChange={(e) => setF({ ...f, endDate: e.target.value })} /></div>
          <div className="sm:col-span-2"><FieldInput label="Change / stop reason" value={f.changeReason} onChange={(v) => setF({ ...f, changeReason: v })} /></div>
          <div className="sm:col-span-2"><FieldInput label="Side effects / effectiveness" value={f.sideEffects} onChange={(v) => setF({ ...f, sideEffects: v })} /></div>
        </div>
        <button className="btn-primary mt-3 w-full" onClick={save}>Save medication</button>
      </div>
      <div className="grid gap-2 content-start">
        {bundle.medications.map((m) => (
          <div key={m.id} className="card">
            <b className="text-sm">{m.medicineName}</b> {m.dosage} {m.frequency} <StatusBadge value={m.medStatus} />
            <div className="text-xs text-slate-500">{m.startDate} → {m.endDate || "ongoing? verify"} • {m.prescribedBy} • {m.reason}</div>
            {m.changeReason && <div className="text-xs">Change: {m.changeReason}</div>}
            <button className="text-xs text-red-600 mt-1" onClick={() => del("medication", m.id, onChange)}>Delete</button>
          </div>
        ))}
        {bundle.medications.length === 0 && <div className="card text-sm text-slate-500">No medications.</div>}
      </div>
    </div>
  );
}

function TestsTab({ bundle, defaultDoctor, onChange }: { bundle: Bundle; defaultDoctor: string; onChange: () => void }) {
  const pid = bundle.id;
  const [f, setF] = useState({ type: "Blood - CBC", date: todayLocal(), source: "", findings: "", interpretation: "", relatedDiagnosis: "", orderedBy: "" });
  useEffect(() => { if (defaultDoctor) setF((p) => (p.orderedBy ? p : { ...p, orderedBy: defaultDoctor })); }, [defaultDoctor]);
  const [file, setFile] = useState<{ name: string; dataUrl: string } | null>(null);
  const onFile = (fl: File | undefined) => {
    if (!fl) return;
    if (fl.size > 3 * 1024 * 1024) { alert("File over 3MB — compress or use smaller scan (DB row limit)."); return; }
    const r = new FileReader();
    r.onload = () => setFile({ name: fl.name, dataUrl: String(r.result) });
    r.readAsDataURL(fl);
  };
  const save = async () => {
    try {
      await saveColl(pid, "investigations", { ...f, fileName: file?.name ?? "", fileDataUrl: file?.dataUrl ?? "" });
      onChange(); setF({ type: "Blood - CBC", date: todayLocal(), source: "", findings: "", interpretation: "", relatedDiagnosis: "", orderedBy: f.orderedBy }); setFile(null);
    } catch (e) { alert((e as Error).message); }
  };
  return (
    <div className="grid lg:grid-cols-2 gap-3">
      <div className="card">
        <h2 className="font-bold mb-2">Add test / upload report</h2>
        <div className="grid sm:grid-cols-2 gap-2">
          <div className="sm:col-span-2"><label className="label">Type</label>
            <select className="input" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>
              {["Blood - CBC", "Blood - HbA1c", "Blood - KFT", "Blood - LFT", "Urine", "X-ray", "CT", "MRI", "Ultrasound", "ECG", "Biopsy/Pathology", "Prescription scan", "Discharge summary", "Consent form", "Referral", "External report", "Other"].map((t) => <option key={t} value={t}>{t}</option>)}
            </select></div>
          <div><label className="label">Date</label><input type="date" className="input" value={f.date} max="2100-12-31" onChange={(e) => setF({ ...f, date: e.target.value })} /></div>
          <FieldInput label="Source / lab" value={f.source} onChange={(v) => setF({ ...f, source: v })} />
          <div className="sm:col-span-2"><FieldArea label="Findings" value={f.findings} onChange={(v) => setF({ ...f, findings: v })} /></div>
          <div className="sm:col-span-2"><FieldArea label="Interpretation" value={f.interpretation} onChange={(v) => setF({ ...f, interpretation: v })} /></div>
          <FieldInput label="Related diagnosis" value={f.relatedDiagnosis} onChange={(v) => setF({ ...f, relatedDiagnosis: v })} />
          <FieldInput label="Ordered by" value={f.orderedBy} onChange={(v) => setF({ ...f, orderedBy: v })} />
          <div className="sm:col-span-2"><label className="label">Upload (PDF/image ≤3MB — S3 for larger in prod)</label>
            <input type="file" className="input" accept=".pdf,image/*" onChange={(e) => onFile(e.target.files?.[0])} />
            {file && <div className="text-xs mt-1">Selected: {file.name}</div>}</div>
        </div>
        <button className="btn-primary mt-3 w-full" onClick={save}>Save report (never overwrites history)</button>
      </div>
      <div className="grid gap-2 content-start">
        {bundle.investigations.map((i) => (
          <div key={i.id} className="card">
            <b className="text-sm">{i.date} — {i.type}</b>
            <div className="text-sm">{i.findings}</div>
            <div className="text-xs text-slate-500">{i.interpretation} • {i.source} • ordered by {i.orderedBy}</div>
            {i.fileDataUrl && <a href={i.fileDataUrl} download={i.fileName || "report"} target="_blank" className="text-xs underline text-emerald-800 font-semibold">View/download {i.fileName}</a>}
            <div><button className="text-xs text-red-600 mt-1" onClick={() => del("investigation", i.id, onChange)}>Delete</button></div>
          </div>
        ))}
        {bundle.investigations.length === 0 && <div className="card text-sm text-slate-500">No reports yet.</div>}
      </div>
    </div>
  );
}

function HistoryTab({ bundle, onChange }: { bundle: Bundle; onChange: () => void }) {
  const pid = bundle.id;
  const [s, setS] = useState({ procedureName: "", date: "", dateStatus: "confirmed" as FieldStatus, reason: "", surgeon: "", outcome: "" });
  const [a, setA] = useState({ substance: "", reaction: "", severity: "Moderate", date: "", dateStatus: "unknown" as FieldStatus, verification: "pending_verification" as FieldStatus, notes: "" });
  const [pv, setPv] = useState({ title: "", kind: "vaccination", dueDate: "" });
  const [rel, setRel] = useState("Father");
  const [cond, setCond] = useState("");
  const postH = async (body: Record<string, unknown>, reset: () => void) => {
    try { await api.postHistory(pid, body); onChange(); reset(); }
    catch (e) { alert((e as Error).message); }
  };
  return (
    <div className="grid lg:grid-cols-2 gap-3">
      <div className="card">
        <h2 className="font-bold">Add surgery</h2>
        <div className="grid sm:grid-cols-2 gap-2 mt-2">
          <div className="sm:col-span-2"><FieldInput label="Procedure *" value={s.procedureName} onChange={(v) => setS({ ...s, procedureName: v })} /></div>
          <div><label className="label">Date</label><input type="date" className="input" value={s.date} max="2100-12-31" onChange={(e) => setS({ ...s, date: e.target.value })} /></div>
          <StatusSelect label="Date status" value={s.dateStatus} onChange={(v) => setS({ ...s, dateStatus: v })} />
          <div className="sm:col-span-2"><FieldInput label="Reason / surgeon / outcome" value={s.reason} onChange={(v) => setS({ ...s, reason: v })} /></div>
        </div>
        <button className="btn-primary mt-2 w-full" onClick={() => {
          if (!s.procedureName.trim()) { alert("Procedure required"); return; }
          postH({ kind: "surgery", ...s }, () => setS({ procedureName: "", date: "", dateStatus: "confirmed" as FieldStatus, reason: "", surgeon: "", outcome: "" }));
        }}>Save surgery</button>
        <div className="mt-2 grid gap-1">{bundle.surgeries.map((x) => <div key={x.id} className="text-sm border rounded-xl p-2"><b>{x.procedureName}</b> {x.date || x.dateStatus} — {x.reason}
          <button className="text-xs text-red-600 ml-2" onClick={() => del("surgery", x.id, onChange)}>Delete</button></div>)}</div>
      </div>
      <div className="card">
        <h2 className="font-bold">Add allergy (critical for safety)</h2>
        <div className="grid sm:grid-cols-2 gap-2 mt-2">
          <FieldInput label="Substance *" value={a.substance} onChange={(v) => setA({ ...a, substance: v })} />
          <FieldInput label="Reaction" value={a.reaction} onChange={(v) => setA({ ...a, reaction: v })} />
          <div><label className="label">Date (calendar)</label><input type="date" className="input" value={a.date} max="2100-12-31" onChange={(e) => setA({ ...a, date: e.target.value })} /></div>
          <StatusSelect label="Date status" value={a.dateStatus} onChange={(v) => setA({ ...a, dateStatus: v })} />
          <div className="sm:col-span-2"><StatusSelect label="Verification" value={a.verification} onChange={(v) => setA({ ...a, verification: v })} /></div>
        </div>
        <button className="btn-primary mt-2 w-full" onClick={() => {
          if (!a.substance.trim()) { alert("Substance required"); return; }
          postH({ kind: "allergy", ...a }, () => setA({ substance: "", reaction: "", severity: "Moderate", date: "", dateStatus: "unknown" as FieldStatus, verification: "pending_verification" as FieldStatus, notes: "" }));
        }}>Save allergy</button>
        <div className="mt-2 grid gap-1">{bundle.allergies.map((x) => <div key={x.id} className="text-sm border rounded-xl p-2"><b>{x.substance}</b> — {x.reaction} <StatusBadge value={x.verification} />
          <button className="text-xs text-red-600 ml-2" onClick={() => del("allergy", x.id, onChange)}>Delete</button></div>)}</div>
      </div>
      <div className="card">
        <h2 className="font-bold">Preventive / follow-up</h2>
        <div className="grid sm:grid-cols-2 gap-2 mt-2">
          <div className="sm:col-span-2"><FieldInput label="Title *" value={pv.title} onChange={(v) => setPv({ ...pv, title: v })} placeholder="e.g. HbA1c due, Flu vaccine" /></div>
          <div><label className="label">Kind</label><select className="input" value={pv.kind} onChange={(e) => setPv({ ...pv, kind: e.target.value })}>{["vaccination", "screening", "checkup", "monitoring", "careplan", "followup"].map((k) => <option key={k} value={k}>{k}</option>)}</select></div>
          <div><label className="label">Due date</label><input type="date" className="input" value={pv.dueDate} max="2100-12-31" onChange={(e) => setPv({ ...pv, dueDate: e.target.value })} /></div>
        </div>
        <button className="btn-ghost mt-2 w-full border" onClick={() => {
          if (!pv.title.trim()) { alert("Title required"); return; }
          postH({ kind: "preventive", kind2: pv.kind, title: pv.title, dueDate: pv.dueDate, date: todayLocal() }, () => setPv({ title: "", kind: "vaccination", dueDate: "" }));
        }}>Add reminder</button>
        <div className="mt-2 grid gap-1">{bundle.preventive.map((x) => <div key={x.id} className="text-sm border rounded-xl p-2"><b>{x.title}</b> [{x.kind}] due {x.dueDate || "—"}
          <button className="text-xs text-red-600 ml-2" onClick={() => del("preventive", x.id, onChange)}>Delete</button></div>)}</div>
        <h2 className="font-bold mt-3">Family history ({bundle.familyHistory.length})</h2>
        <div className="flex gap-2 mt-1">
          <input className="input" value={rel} onChange={(e) => setRel(e.target.value)} placeholder="Relation" />
          <input className="input" value={cond} onChange={(e) => setCond(e.target.value)} placeholder="Condition" />
          <button className="btn-ghost border shrink-0" onClick={() => {
            if (!cond.trim()) return;
            postH({ kind: "family", relation: rel, condition: cond }, () => setCond(""));
          }}>Add</button>
        </div>
        {bundle.familyHistory.map((x) => <div key={x.id} className="text-sm border rounded-xl p-2 mt-1">{x.relation}: {x.condition}
          <button className="text-xs text-red-600 ml-2" onClick={() => del("familyHistory", x.id, onChange)}>Delete</button></div>)}
      </div>
      <div className="card">
        <h2 className="font-bold">Record integrity</h2>
        <p className="text-sm text-slate-600 mt-1">Every change is audit-logged with actor + timestamp. Records are never silently overwritten.</p>
      </div>
    </div>
  );
}
