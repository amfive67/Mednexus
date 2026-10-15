import { FIELD_STATUS_LABELS, type Allergy, type Condition, type Encounter, type FieldStatus, type Investigation, type Medication, type Patient } from "./types";
import { todayLocal } from "./dates";

export function statusLabel(s?: string): string {
  if (!s) return "—";
  return (FIELD_STATUS_LABELS as Record<string, string>)[s] ?? s;
}

export function missingReport(p: Patient, conds: Condition[], meds: Medication[], encs: Encounter[], invs: Investigation[], allergies: Allergy[]): string[] {
  const out: string[] = [];
  if (!p.bloodGroup) out.push(`Blood group: ${statusLabel(p.bloodGroupStatus)}`);
  if (!p.phone) out.push("Contact phone missing");
  if (allergies.length === 0 && !p.allergiesNote) out.push("Allergy history: not recorded yet — distinguish from 'No known allergies'");
  const unverifiedMeds = meds.filter((m) => m.medStatus === "unverified").length;
  if (unverifiedMeds) out.push(`${unverifiedMeds} medication(s) unverified`);
  const unknownCause = conds.filter((c) => c.causeStatus === "unknown" || c.causeStatus === "not_recorded").length;
  if (unknownCause) out.push(`${unknownCause} condition(s) with unknown cause (explicitly recorded)`);
  if (encs.length === 0) out.push("No encounters yet");
  if (invs.length === 0) out.push("No investigations on file");
  const overdue = encs.filter((e) => e.followUpDate && e.followUpDate < todayLocal()).length;
  if (overdue) out.push(`${overdue} overdue follow-up(s)`);
  return out;
}

export function clinicalAlerts(p: Patient, allergies: Allergy[], meds: Medication[], conds: Condition[], encs: Encounter[]): { level: "warning" | "info"; text: string }[] {
  const alerts: { level: "warning" | "info"; text: string }[] = [];
  allergies.forEach((a) => {
    if (a.substance) alerts.push({ level: "warning", text: `Allergy: ${a.substance} — ${a.reaction} (${a.severity}). Verification: ${statusLabel(a.verification)}` });
  });
  const names = meds.filter((m) => m.medStatus === "current").map((m) => m.medicineName.toLowerCase());
  const dupes = names.filter((n, i) => names.indexOf(n) !== i);
  if (dupes.length) alerts.push({ level: "warning", text: `Possible duplicate current medication: ${Array.from(new Set(dupes)).join(", ")}` });
  // naive interaction hint: NSAID + HTN / Metformin + contrast — rule stub, must be reviewed
  if (names.some((n) => n.includes("ibuprofen") || n.includes("diclofenac")) && conds.some((c) => c.name.toLowerCase().includes("hypertension")))
    alerts.push({ level: "warning", text: "NSAID in hypertensive patient — review renal/BP risk (rule-based hint, verify clinically)." });
  const overdue = encs.filter((e) => e.followUpDate && e.followUpDate < todayLocal());
  overdue.forEach((e) => alerts.push({ level: "info", text: `Overdue follow-up from ${e.dateTime.slice(0, 10)} (due ${e.followUpDate}).` }));
  if (!p.bloodGroup) alerts.push({ level: "info", text: "Blood group unknown — confirm before procedures/transfusion." });
  return alerts;
}

// Traceable, non-fabricating summary: only states what is recorded.
export function aiSummary(p: Patient, conds: Condition[], meds: Medication[], encs: Encounter[], invs: Investigation[]): string {
  const lines: string[] = [];
  lines.push(`SUMMARY (record-based, not a diagnosis) — ${p.fullName} (${p.id})`);
  lines.push(`DOB ${p.dob || "unknown"} | Blood ${p.bloodGroup || statusLabel(p.bloodGroupStatus)}`);
  lines.push("");
  lines.push(`Conditions (${conds.length}):`);
  if (!conds.length) lines.push("- None recorded (≠ disease-free).");
  conds.slice(0, 10).forEach((c) => {
    lines.push(`- ${c.name} [${c.status}] onset ${c.onsetDate || statusLabel(c.onsetStatus)}; cause: ${c.cause || statusLabel(c.causeStatus)}; response: ${c.response || "not recorded"}`);
  });
  lines.push("");
  lines.push(`Medications (${meds.length}):`);
  if (!meds.length) lines.push("- None recorded.");
  meds.slice(0, 10).forEach((m) => {
    lines.push(`- ${m.medicineName} ${m.dosage} ${m.frequency} [${m.medStatus}] ${m.startDate}→${m.endDate || "ongoing? unverified"}; reason: ${m.reason || "not recorded"}; change: ${m.changeReason || "—"}`);
  });
  lines.push("");
  lines.push(`Encounters (${encs.length}), Investigations (${invs.length}):`);
  encs.slice(0, 5).forEach((e) => lines.push(`- ${e.dateTime.slice(0, 10)} ${e.department} ${e.doctor}: ${e.finalDx || e.provisionalDx || e.reason}`));
  invs.slice(0, 5).forEach((i) => lines.push(`- ${i.date} ${i.type}: ${i.findings} (${i.interpretation || "no interpretation"})`));
  lines.push("");
  lines.push("Gaps / uncertainties: see Missing Information panel. Do not assume unrecorded = absent.");
  return lines.join("\n");
}
