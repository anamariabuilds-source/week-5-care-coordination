import { describe, expect, it } from "vitest";
import { aiFacilityProposalSchema, confirmationEvidenceSchema, facilityVerificationRecordSchema } from "./schemas";
import { staleFacilityRecord } from "./fixtures";

describe("authoritative schemas", () => {
  it("accepts the simulated facility fixture and rejects missing provenance", () => {
    expect(facilityVerificationRecordSchema.safeParse(staleFacilityRecord).success).toBe(true);
    expect(facilityVerificationRecordSchema.safeParse({ ...staleFacilityRecord, sourceContact: "" }).success).toBe(false);
  });
  it("requires complete confirmation evidence", () => {
    expect(confirmationEvidenceSchema.safeParse({ reservedDate: "2026-10-20", reservedTime: "09:30", confirmationSource: "Simulated call" }).success).toBe(true);
    expect(confirmationEvidenceSchema.safeParse({ reservedDate: "2026-10-20", reservedTime: "", confirmationSource: "" }).success).toBe(false);
  });
  it("preserves unsupported AI facts as null", () => expect(aiFacilityProposalSchema.safeParse({ procedureOffered: null, serviceStatus: "NOT_CONFIRMED", reportedGeneralAvailability: null, statedMedicalChargeMxn: null, statedChargeExclusions: null, prerequisites: null, acceptanceReferralRules: null, freshnessStatus: "NOT_CONFIRMED" }).success).toBe(true));
});
