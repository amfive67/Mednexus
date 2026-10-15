// Shared patient-registration validation (used by UI + API — single source of truth).
export function validatePatientInput(b: Record<string, unknown>): string[] {
  const errs: string[] = [];
  const s = (v: unknown) => String(v ?? "").trim();

  if (!s(b.fullName)) errs.push("Full name is required.");

  if (!s(b.dob)) {
    errs.push("Date of birth is required.");
  } else {
    const d = new Date(`${s(b.dob)}T00:00:00`);
    if (isNaN(d.getTime())) {
      errs.push("Date of birth is not a valid date.");
    } else if (d.getTime() > Date.now()) {
      errs.push("Date of birth cannot be in the future.");
    } else {
      const age = Math.floor((Date.now() - d.getTime()) / 3.15576e10);
      if (age > 130) errs.push("Age is over 130 — please check the date of birth.");
    }
  }

  if (!["Male", "Female", "Other"].includes(s(b.gender))) errs.push("Please select a gender.");

  const phoneDigits = s(b.phone).replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
  if (phoneDigits.length !== 10) errs.push("Phone must be a valid 10-digit mobile number.");

  if (!s(b.emergencyContact)) {
    errs.push("Emergency contact is required.");
  } else if (s(b.emergencyContact).replace(/\D/g, "").length < 7) {
    errs.push("Emergency contact must include a valid phone number.");
  }

  if (s(b.address).length < 5) errs.push("Address is required (minimum 5 characters).");

  if (s(b.bloodGroup) && !/^(A|B|AB|O)[+-]$/i.test(s(b.bloodGroup)))
    errs.push("Blood group must look like A+, B-, O+ or AB+ (or leave it blank).");

  if (b.consent !== true) errs.push("Patient consent is required to store medical records.");

  return errs;
}
