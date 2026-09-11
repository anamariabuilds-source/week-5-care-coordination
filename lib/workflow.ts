import { confirmationEvidenceSchema, schedulingConsentSchema, type ConfirmationEvidence, type FacilityVerificationRecord, type Procedure, type SchedulingConsent } from "./schemas";

export type WorkflowState =
  | "NEXT_STEP_MISSING" | "FACILITY_INFO_UNAVAILABLE_OR_STALE" | "FACILITY_REPORTED"
  | "CONSENT_MISSING_OR_INVALID" | "APPOINTMENT_REQUESTED" | "FACILITY_DENIED_OR_UNAVAILABLE"
  | "BOOKING_BLOCKED_UNSUPPORTED_DOCUMENT_CHANNEL" | "APPOINTMENT_CONFIRMED" | "PATIENT_REFUSED_OR_REVOKED";

export type WorkflowInput = {
  nextStep: Procedure | null;
  facilityId: string;
  record: FacilityVerificationRecord | null;
  consent: SchedulingConsent;
  requested: boolean;
  facilityResponse: "NONE" | "DENIED" | "UNSUPPORTED_DOCUMENT";
  confirmation: ConfirmationEvidence | null;
};

export function consentMatches(input: WorkflowInput) {
  const parsed = schedulingConsentSchema.safeParse(input.consent);
  return parsed.success && parsed.data.status === "GIVEN" && parsed.data.facilityId === input.facilityId && parsed.data.procedure === input.nextStep;
}

export function deriveWorkflowState(input: WorkflowInput): WorkflowState {
  if (input.consent.status === "REFUSED" || input.consent.status === "REVOKED") return "PATIENT_REFUSED_OR_REVOKED";
  if (!input.nextStep) return "NEXT_STEP_MISSING";
  if (!input.record || input.record.approvalStatus !== "APPROVED" || input.record.freshnessStatus !== "CURRENTLY_REPORTED") return "FACILITY_INFO_UNAVAILABLE_OR_STALE";
  if (!input.requested) return consentMatches(input) ? "FACILITY_REPORTED" : "CONSENT_MISSING_OR_INVALID";
  if (input.facilityResponse === "DENIED") return "FACILITY_DENIED_OR_UNAVAILABLE";
  if (input.facilityResponse === "UNSUPPORTED_DOCUMENT") return "BOOKING_BLOCKED_UNSUPPORTED_DOCUMENT_CHANNEL";
  if (input.confirmation && confirmationEvidenceSchema.safeParse(input.confirmation).success) return "APPOINTMENT_CONFIRMED";
  return "APPOINTMENT_REQUESTED";
}
