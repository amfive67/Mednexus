// Core domain types — maps to prompt.txt §2-§21
// Principle: missing !== negative. Every clinical value carries a status.

export type FieldStatus =
  | "confirmed"
  | "unknown"
  | "not_remembered"
  | "not_provided"
  | "not_recorded"
  | "not_applicable"
  | "pending_verification"
  | "other";

export const FIELD_STATUS_LABELS: Record<FieldStatus, string> = {
  confirmed: "Confirmed",
  unknown: "Unknown",
  not_remembered: "Patient does not remember",
  not_provided: "Not provided",
  not_recorded: "Not recorded yet",
  not_applicable: "Not applicable",
  pending_verification: "Pending verification",
  other: "Other — see note",
};

export type Role = "doctor" | "nurse" | "reception" | "admin" | "specialist";

export interface User {
  id: string;
  name: string;
  role: Role;
}

export interface Patient {
  id: string; // Unique Patient ID e.g. PAT-2026-XXXX
  fullName: string;
  dob: string;
  age: number;
  gender: string;
  genderStatus: FieldStatus;
  phone: string;
  address: string;
  emergencyContact: string;
  bloodGroup: string;
  bloodGroupStatus: FieldStatus;
  allergiesNote: string;
  existingConditions: string;
  familyHistoryNote: string;
  lifestyleRisks: string;
  consent: boolean;
  consentDate?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Condition {
  id: string;
  patientId: string;
  name: string;
  icdHint?: string;
  onsetDate: string;
  onsetStatus: FieldStatus;
  diagnosedDate: string;
  symptoms: string;
  cause: string;
  causeStatus: FieldStatus; // confirmed / suspected / unknown — never invented
  examFindings: string;
  provisionalDx: string;
  confirmedDx: string;
  differentials: string;
  severity: string; // mild/moderate/severe/stage
  status: "active" | "controlled" | "uncontrolled" | "resolved" | "other";
  complications: string;
  treatmentPlan: string;
  response: string;
  notes: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Medication {
  id: string;
  patientId: string;
  medicineName: string;
  genericName: string;
  reason: string;
  relatedDiagnosis: string;
  prescribedBy: string;
  prescriptionDate: string;
  dosage: string;
  frequency: string;
  route: string;
  duration: string;
  startDate: string;
  endDate: string;
  endStatus: FieldStatus;
  medStatus: "current" | "historical" | "discontinued" | "unverified";
  changeReason: string;
  sideEffects: string;
  effectiveness: string;
  adherence: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Encounter {
  id: string;
  patientId: string;
  dateTime: string;
  facility: string;
  department: string;
  doctor: string;
  reason: string;
  chiefComplaint: string;
  symptoms: string;
  vitals: string; // BP, HR, Temp, SpO2, weight
  examFindings: string;
  provisionalDx: string;
  finalDx: string;
  finalDxStatus: FieldStatus;
  investigationsOrdered: string;
  treatment: string;
  procedures: string;
  notes: string;
  followUpDate: string;
  outcome: string;
  finalized: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Investigation {
  id: string;
  patientId: string;
  encounterId?: string;
  type: string; // Blood, Urine, X-ray, CT, MRI, USG, ECG, Biopsy...
  date: string;
  source: string;
  findings: string;
  interpretation: string;
  relatedDiagnosis: string;
  orderedBy: string;
  fileName?: string;
  fileDataUrl?: string; // base64 for demo; use S3 in production
  createdBy: string;
  createdAt: string;
}

export interface Surgery {
  id: string;
  patientId: string;
  procedureName: string;
  date: string;
  dateStatus: FieldStatus;
  location: string;
  reason: string;
  surgeon: string;
  preopFindings: string;
  operativeNotes: string;
  complications: string;
  outcome: string;
  createdBy: string;
  createdAt: string;
}

export interface Allergy {
  id: string;
  patientId: string;
  substance: string;
  reaction: string;
  severity: string;
  date: string;
  dateStatus: FieldStatus;
  source: string; // patient-reported / observed / document
  verification: FieldStatus;
  notes: string;
  createdBy: string;
  createdAt: string;
}

export interface FamilyEntry {
  id: string;
  patientId: string;
  relation: string;
  condition: string;
  onsetAge: string;
  onsetStatus: FieldStatus;
  verification: FieldStatus;
  createdBy: string;
  createdAt: string;
}

export interface Preventive {
  id: string;
  patientId: string;
  kind: "vaccination" | "screening" | "checkup" | "monitoring" | "careplan" | "followup";
  title: string;
  date: string;
  dateStatus: FieldStatus;
  details: string;
  dueDate: string;
  done: boolean;
  createdBy: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  patientId: string;
  actor: string;
  action: string;
  entity: string;
  entityId: string;
  detail: string;
  at: string;
}

export interface TimelineItem {
  id: string;
  date: string;
  kind: string;
  title: string;
  detail: string;
  link: string;
}
