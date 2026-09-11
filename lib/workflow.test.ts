import { describe, expect, it } from "vitest";
import { staleFacilityRecord } from "./fixtures";
import { deriveWorkflowState, type WorkflowInput } from "./workflow";

const approved = { ...staleFacilityRecord, freshnessStatus: "CURRENTLY_REPORTED" as const };
const base: WorkflowInput = { nextStep: "COLPOSCOPY", facilityId: approved.facilityId, record: approved, consent: { status: "GIVEN", facilityId: approved.facilityId, procedure: "COLPOSCOPY", disclosedFields: ["simulated label"], recordedAt: "2026-09-10T15:00:00.000Z" }, requested: false, facilityResponse: "NONE", confirmation: null };

describe("deterministic workflow", () => {
  it("blocks a missing provider-documented next step", () => expect(deriveWorkflowState({ ...base, nextStep: null })).toBe("NEXT_STEP_MISSING"));
  it("blocks missing and mismatched consent", () => {
    expect(deriveWorkflowState({ ...base, consent: { ...base.consent, status: "NOT_GIVEN", facilityId: null, procedure: null } })).toBe("CONSENT_MISSING_OR_INVALID");
    expect(deriveWorkflowState({ ...base, consent: { ...base.consent, facilityId: "other" } })).toBe("CONSENT_MISSING_OR_INVALID");
  });
  it("separates reported, requested, and confirmed", () => {
    expect(deriveWorkflowState(base)).toBe("FACILITY_REPORTED");
    expect(deriveWorkflowState({ ...base, requested: true })).toBe("APPOINTMENT_REQUESTED");
    expect(deriveWorkflowState({ ...base, requested: true, confirmation: { reservedDate: "2026-10-20", reservedTime: "09:30", confirmationSource: "Simulated facility call" } })).toBe("APPOINTMENT_CONFIRMED");
  });
  it("invalidates confirmation when evidence is removed", () => expect(deriveWorkflowState({ ...base, requested: true, confirmation: null })).toBe("APPOINTMENT_REQUESTED"));
  it("makes refusal and revocation terminal", () => {
    expect(deriveWorkflowState({ ...base, consent: { ...base.consent, status: "REFUSED" } })).toBe("PATIENT_REFUSED_OR_REVOKED");
    expect(deriveWorkflowState({ ...base, requested: true, consent: { ...base.consent, status: "REVOKED" } })).toBe("PATIENT_REFUSED_OR_REVOKED");
  });
  it("keeps denial and unsupported documents unconfirmed", () => {
    expect(deriveWorkflowState({ ...base, requested: true, facilityResponse: "DENIED" })).toBe("FACILITY_DENIED_OR_UNAVAILABLE");
    expect(deriveWorkflowState({ ...base, requested: true, facilityResponse: "UNSUPPORTED_DOCUMENT" })).toBe("BOOKING_BLOCKED_UNSUPPORTED_DOCUMENT_CHANNEL");
  });
});
