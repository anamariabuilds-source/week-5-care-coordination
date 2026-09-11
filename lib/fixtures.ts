import {
  facilityVerificationRecordSchema,
  type FacilityVerificationRecord,
  type Procedure,
} from "./schemas";

export type SimulatedCase = {
  displayLabel: string;
  providerDocumentedNextStep: Procedure | null;
  facilityId: string;
};

export type SimulatedFacility = {
  id: string;
  name: string;
  simulated: true;
};

export const simulatedFacilities: SimulatedFacility[] = [
  { id: "facility-aurora", name: "Centro Aurora", simulated: true },
  { id: "facility-lucero", name: "Clínica Lucero", simulated: true },
];

export const simulatedCase: SimulatedCase = {
  displayLabel: "Simulated case: Patient Sol",
  providerDocumentedNextStep: "COLPOSCOPY",
  facilityId: "facility-aurora",
};

export const staleFacilityRecord: FacilityVerificationRecord =
  facilityVerificationRecordSchema.parse({
    recordId: "record-lucero-stale",
    facilityId: "facility-lucero",
    facilityName: "Clínica Lucero",
    procedureOffered: "COLPOSCOPY",
    serviceStatus: "REPORTED",
    reportedGeneralAvailability: null,
    statedMedicalChargeMxn: null,
    statedChargeExclusions: null,
    prerequisites: "Referral reported as required; details not confirmed.",
    acceptanceReferralRules: null,
    sourceContact: "Simulated facility phone call",
    verificationTimestamp: "2025-01-15T16:30:00.000Z",
    freshnessStatus: "NOT_RECENTLY_VERIFIED",
    approvalStatus: "APPROVED",
    approvedBy: "Simulated operator",
    approvedAt: "2025-01-15T16:40:00.000Z",
  });

