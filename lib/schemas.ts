import { z } from "zod";

export const procedureSchema = z.enum(["COLPOSCOPY"]);
export const informationStatusSchema = z.enum(["REPORTED", "NOT_CONFIRMED"]);
export const freshnessStatusSchema = z.enum([
  "CURRENTLY_REPORTED",
  "NOT_RECENTLY_VERIFIED",
  "NOT_CONFIRMED",
]);
export const approvalStatusSchema = z.enum(["PENDING_REVIEW", "APPROVED"]);

const optionalReportSchema = z
  .string()
  .trim()
  .max(500, "Use 500 characters or fewer.")
  .transform((value) => (value === "" ? null : value))
  .nullable();

export const facilityVerificationQuestionnaireSchema = z.object({
  facilityId: z.string().trim().min(1).max(80),
  facilityName: z.string().trim().min(2).max(120),
  procedureOffered: procedureSchema,
  serviceStatus: informationStatusSchema,
  reportedGeneralAvailability: optionalReportSchema,
  statedMedicalChargeMxn: z.number().nonnegative().max(1_000_000).nullable(),
  statedChargeExclusions: optionalReportSchema,
  prerequisites: optionalReportSchema,
  acceptanceReferralRules: optionalReportSchema,
  sourceContact: z.string().trim().min(2).max(160),
  verificationTimestamp: z.string().datetime({ offset: true }),
  freshnessStatus: freshnessStatusSchema,
});

export const facilityVerificationRecordSchema = facilityVerificationQuestionnaireSchema.extend({
  recordId: z.string().trim().min(1).max(80),
  approvalStatus: approvalStatusSchema,
  approvedBy: z.string().trim().min(2).max(120).nullable(),
  approvedAt: z.string().datetime({ offset: true }).nullable(),
});

export const schedulingConsentSchema = z.object({
  status: z.enum(["NOT_GIVEN", "GIVEN", "REFUSED", "REVOKED"]),
  facilityId: z.string().trim().min(1).max(80).nullable(),
  procedure: procedureSchema.nullable(),
  disclosedFields: z.array(z.string().trim().min(1).max(80)).max(10),
  recordedAt: z.string().datetime({ offset: true }).nullable(),
});

export const supportPersonPermissionSchema = z.object({
  authorized: z.boolean(),
  simulatedSupportPersonLabel: z.string().trim().min(2).max(80).nullable(),
  recordedAt: z.string().datetime({ offset: true }).nullable(),
});

export const confirmationEvidenceSchema = z.object({
  reservedDate: z.string().date(),
  reservedTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use 24-hour HH:MM time."),
  confirmationSource: z.string().trim().min(2).max(160),
});

export type Procedure = z.infer<typeof procedureSchema>;
export type FacilityVerificationQuestionnaire = z.infer<
  typeof facilityVerificationQuestionnaireSchema
>;
export type FacilityVerificationRecord = z.infer<typeof facilityVerificationRecordSchema>;
export type SchedulingConsent = z.infer<typeof schedulingConsentSchema>;
export type SupportPersonPermission = z.infer<typeof supportPersonPermissionSchema>;
export type ConfirmationEvidence = z.infer<typeof confirmationEvidenceSchema>;

