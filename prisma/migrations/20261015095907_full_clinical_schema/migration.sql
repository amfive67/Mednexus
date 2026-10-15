-- AlterTable
ALTER TABLE "Allergy" ADD COLUMN     "date" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "dateStatus" "FieldStatus" NOT NULL DEFAULT 'not_remembered',
ADD COLUMN     "notes" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "severity" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'patient-reported';

-- AlterTable
ALTER TABLE "Condition" ADD COLUMN     "complications" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "confirmedDx" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "differentials" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "examFindings" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "icdHint" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "provisionalDx" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "severity" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "symptoms" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "Encounter" ADD COLUMN     "chiefComplaint" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "examFindings" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "investigationsOrdered" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "outcome" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "procedures" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "provisionalDx" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "symptoms" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "Investigation" ADD COLUMN     "encounterId" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "fileDataUrl" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "fileName" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "interpretation" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "orderedBy" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "relatedDiagnosis" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "source" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "Medication" ADD COLUMN     "adherence" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "duration" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "effectiveness" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "endStatus" "FieldStatus" NOT NULL DEFAULT 'confirmed',
ADD COLUMN     "genericName" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "prescriptionDate" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "relatedDiagnosis" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "route" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "sideEffects" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "Surgery" ADD COLUMN     "complications" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "dateStatus" "FieldStatus" NOT NULL DEFAULT 'confirmed',
ADD COLUMN     "location" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "operativeNotes" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "preopFindings" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "reason" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "surgeon" TEXT NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE "FamilyHistory" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "relation" TEXT NOT NULL DEFAULT '',
    "condition" TEXT NOT NULL DEFAULT '',
    "onsetAge" TEXT NOT NULL DEFAULT '',
    "onsetStatus" "FieldStatus" NOT NULL DEFAULT 'unknown',
    "verification" "FieldStatus" NOT NULL DEFAULT 'pending_verification',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FamilyHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Preventive" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'checkup',
    "title" TEXT NOT NULL,
    "date" TEXT NOT NULL DEFAULT '',
    "dateStatus" "FieldStatus" NOT NULL DEFAULT 'confirmed',
    "details" TEXT NOT NULL DEFAULT '',
    "dueDate" TEXT NOT NULL DEFAULT '',
    "done" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Preventive_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FamilyHistory" ADD CONSTRAINT "FamilyHistory_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Preventive" ADD CONSTRAINT "Preventive_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
