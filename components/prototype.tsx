"use client";

import { FormEvent, useState } from "react";
import { simulatedCase, simulatedFacilities, staleFacilityRecord } from "../lib/fixtures";
import {
  facilityVerificationQuestionnaireSchema,
  facilityVerificationRecordSchema,
  type FacilityVerificationRecord,
  type AiFacilityProposal,
} from "../lib/schemas";
import { consentMatches, deriveWorkflowState } from "../lib/workflow";

const emptyValue = "Not confirmed";

function displayValue(value: string | number | null) {
  return value === null ? emptyValue : value;
}

function formatProcedure(procedure: "COLPOSCOPY") {
  return procedure === "COLPOSCOPY" ? "Colposcopy" : procedure;
}

export function Prototype() {
  const selectedFacility = simulatedFacilities.find(
    (facility) => facility.id === simulatedCase.facilityId,
  )!;
  const [record, setRecord] = useState<FacilityVerificationRecord | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [aiProposal, setAiProposal] = useState<AiFacilityProposal | null>(null);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [nextStepPresent, setNextStepPresent] = useState(true);
  const [consentStatus, setConsentStatus] = useState<"NOT_GIVEN" | "GIVEN" | "REFUSED" | "REVOKED">("NOT_GIVEN");
  const [supportPermission, setSupportPermission] = useState(false);
  const [requested, setRequested] = useState(false);
  const [facilityResponse, setFacilityResponse] = useState<"NONE" | "DENIED" | "UNSUPPORTED_DOCUMENT">("NONE");
  const [confirmation, setConfirmation] = useState<{ reservedDate: string; reservedTime: string; confirmationSource: string } | null>(null);

  const workflowInput = {
    nextStep: nextStepPresent ? simulatedCase.providerDocumentedNextStep : null,
    facilityId: selectedFacility.id,
    record,
    consent: {
      status: consentStatus,
      facilityId: consentStatus === "GIVEN" ? selectedFacility.id : null,
      procedure: consentStatus === "GIVEN" ? simulatedCase.providerDocumentedNextStep : null,
      disclosedFields: consentStatus === "GIVEN" ? ["simulated patient label", "contact preference", "documented procedure"] : [],
      recordedAt: consentStatus === "GIVEN" ? new Date().toISOString() : null,
    },
    requested,
    facilityResponse,
    confirmation,
  } as const;
  const workflowState = deriveWorkflowState(workflowInput);
  const closed = workflowState === "PATIENT_REFUSED_OR_REVOKED";

  function handleQuestionnaire(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const chargeText = String(data.get("statedMedicalChargeMxn") ?? "").trim();
    const result = facilityVerificationQuestionnaireSchema.safeParse({
      facilityId: selectedFacility.id,
      facilityName: selectedFacility.name,
      procedureOffered: data.get("procedureOffered"),
      serviceStatus: data.get("serviceStatus"),
      reportedGeneralAvailability: data.get("reportedGeneralAvailability"),
      statedMedicalChargeMxn: chargeText === "" ? null : Number(chargeText),
      statedChargeExclusions: data.get("statedChargeExclusions"),
      prerequisites: data.get("prerequisites"),
      acceptanceReferralRules: data.get("acceptanceReferralRules"),
      sourceContact: data.get("sourceContact"),
      verificationTimestamp: data.get("verificationTimestamp"),
      freshnessStatus: data.get("freshnessStatus"),
    });

    if (!result.success) {
      setFormError(result.error.issues[0]?.message ?? "Check the questionnaire fields.");
      return;
    }

    setRecord(
      facilityVerificationRecordSchema.parse({
        ...result.data,
        recordId: `manual-${Date.now()}`,
        approvalStatus: "PENDING_REVIEW",
        approvedBy: null,
        approvedAt: null,
      }),
    );
    setFormError(null);
  }

  function approveRecord() {
    if (!record) return;
    const approved = facilityVerificationRecordSchema.safeParse({
      ...record,
      approvalStatus: "APPROVED",
      approvedBy: "Simulated navigator",
      approvedAt: new Date().toISOString(),
    });
    if (!approved.success) {
      setFormError("The record could not be approved because required fields are invalid.");
      return;
    }
    setRecord(approved.data);
    setFormError(null);
  }

  async function requestAiProposal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setAiProposal(null); setAiMessage("Requesting bounded proposal…");
    const notes = String(new FormData(event.currentTarget).get("notes") ?? "");
    try {
      const response = await fetch("/api/facility-extraction", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notes }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setAiProposal(body.proposal); setAiMessage("Proposal ready. It is non-authoritative until human review and approval.");
    } catch (error) { setAiMessage(error instanceof Error ? error.message : "AI unavailable. Continue manually."); }
  }

  function reviewAiProposal() {
    if (!aiProposal?.procedureOffered) { setAiMessage("Procedure was not supported by the notes. Continue manually."); return; }
    setRecord(facilityVerificationRecordSchema.parse({ ...aiProposal, recordId: `ai-${Date.now()}`, facilityId: selectedFacility.id, facilityName: selectedFacility.name, sourceContact: "AI proposal from simulated facility-call notes — human verification required", verificationTimestamp: new Date().toISOString(), approvalStatus: "PENDING_REVIEW", approvedBy: null, approvedAt: null }));
    setAiMessage("Proposal copied to pending human review. It is still not approved or patient-facing.");
  }

  return (
    <main>
      <header className="hero">
        <p className="kicker">Week 5 · Referral-to-appointment coordination</p>
        <h1>A bounded classroom workflow after a provider documents the next step.</h1>
        <p className="hero-copy">
          In this simulated case, an authorized provider already documented <strong>Colposcopy</strong> as the
          next clinical step. This system did not choose, infer, or recommend the procedure.
        </p>
        <div className="scope-note">
          This prototype demonstrates workflow mechanics only. It does not interpret clinical results,
          establish real facility participation, or prove completed care.
        </div>
      </header>

      <section className="views" aria-labelledby="views-heading">
        <div className="section-heading">
          <div>
            <p className="kicker">Four required views</p>
            <h2 id="views-heading">One small, inspectable slice</h2>
          </div>
        </div>

        <div className="view-stack">
          <article className="view-card" aria-labelledby="case-title">
            <div className="card-topline">
              <span className="view-number">01</span>
              <span className="eyebrow">Patient boundary</span>
            </div>
            <h3 id="case-title">Simulated case + consent</h3>
            <div className="summary-grid">
              <div><span>Case</span><strong>{simulatedCase.displayLabel}</strong></div>
              <div><span>Provider-documented next step</span><strong>{nextStepPresent ? "Colposcopy" : "Next clinical step not documented"}</strong></div>
              <div><span>Selected simulated facility</span><strong>{selectedFacility.name}</strong></div>
            </div>
            <label className="demo-toggle"><input type="checkbox" checked={nextStepPresent} onChange={(event) => { setNextStepPresent(event.target.checked); setRequested(false); setConfirmation(null); }} /> Simulate provider-documented next step present</label>
            <p className="boundary-copy">
              The procedure is an existing provider-documented condition for this workflow. The system did
              not select it. Interactive consent controls are intentionally deferred to the core workflow milestone.
            </p>
          </article>

          <article className="view-card" aria-labelledby="capture-title">
            <div className="card-topline">
              <span className="view-number">02</span>
              <span className="eyebrow">Structured signal · Human operator</span>
            </div>
            <h3 id="capture-title">Navigator facility-call capture</h3>
            <p>
              Facility Verification Questionnaire — completed manually from a simulated facility call and
              stored as a Facility Verification Record.
            </p>
            <aside className="ai-box"><p className="kicker">Optional experimental AI assistance</p><p>Simulated facility-call notes only. Never enter patient names, identifiers, phone numbers, results, referrals, clinical notes, or documents. AI only proposes fields; manual entry remains available.</p>
              <form onSubmit={requestAiProposal}><textarea name="notes" required minLength={20} maxLength={3000} defaultValue="Simulated facility reports colposcopy is offered. General appointments may be available next week. Referral required. Stated charge is 1450 MXN; laboratory work is excluded." /><button type="submit">Propose structured fields with AI</button></form>
              {aiMessage && <p role="status">{aiMessage}</p>}
              {aiProposal && <div><pre>{JSON.stringify(aiProposal, null, 2)}</pre><button type="button" onClick={reviewAiProposal}>Send proposal to human record review</button><button className="secondary" type="button" onClick={() => { setAiProposal(null); setAiMessage("Proposal ignored. Manual entry is unchanged."); }}>Ignore proposal</button></div>}
            </aside>
            <form className="questionnaire" onSubmit={handleQuestionnaire}>
              <label>
                Procedure/service offered
                <select name="procedureOffered" defaultValue="COLPOSCOPY">
                  <option value="COLPOSCOPY">Colposcopy</option>
                </select>
              </label>
              <label>
                Service report status
                <select name="serviceStatus" defaultValue="REPORTED">
                  <option value="REPORTED">Facility reported service</option>
                  <option value="NOT_CONFIRMED">Not confirmed</option>
                </select>
              </label>
              <label className="wide">
                Reported general availability
                <textarea name="reportedGeneralAvailability" maxLength={500} defaultValue="General appointments may be available next week; no patient slot reserved." />
              </label>
              <label>
                Stated medical charge (MXN)
                <input name="statedMedicalChargeMxn" type="number" min="0" max="1000000" defaultValue="1450" />
              </label>
              <label>
                Stated charge exclusions
                <input name="statedChargeExclusions" maxLength={500} defaultValue="Laboratory work not included." />
              </label>
              <label>
                Prerequisites
                <input name="prerequisites" maxLength={500} defaultValue="Referral required." />
              </label>
              <label>
                Acceptance/referral rules
                <input name="acceptanceReferralRules" maxLength={500} defaultValue="Facility reviews referral through its official channel." />
              </label>
              <label>
                Facility/source contact
                <input name="sourceContact" required maxLength={160} defaultValue="Simulated call with facility scheduling desk" />
              </label>
              <label>
                Verification timestamp
                <input name="verificationTimestamp" type="text" required defaultValue="2026-09-10T15:00:00.000Z" />
              </label>
              <label>
                Freshness/uncertainty
                <select name="freshnessStatus" defaultValue="CURRENTLY_REPORTED">
                  <option value="CURRENTLY_REPORTED">Currently reported</option>
                  <option value="NOT_RECENTLY_VERIFIED">Not recently verified</option>
                  <option value="NOT_CONFIRMED">Not confirmed</option>
                </select>
              </label>
              <div className="form-actions wide">
                <button type="submit">Create pending record</button>
                <span>Manual entry works without AI.</span>
              </div>
            </form>
            {formError && <p className="error" role="alert">{formError}</p>}

            {record && (
              <div className="review-box" aria-live="polite">
                <div>
                  <p className="kicker">Operator review</p>
                  <h4>{record.facilityName}</h4>
                  <p>Status: <strong>{record.approvalStatus === "APPROVED" ? "Approved" : "Pending human review"}</strong></p>
                </div>
                {record.approvalStatus === "PENDING_REVIEW" && (
                  <button type="button" onClick={approveRecord}>Approve record as human operator</button>
                )}
              </div>
            )}
          </article>

          <article className="view-card" aria-labelledby="facility-title">
            <div className="card-topline">
              <span className="view-number">03</span>
              <span className="eyebrow">Approved facility information only</span>
            </div>
            <h3 id="facility-title">Facility information</h3>
            {record?.approvalStatus === "APPROVED" ? (
              <dl className="record-grid">
                <div><dt>Simulated facility</dt><dd>{record.facilityName}</dd></div>
                <div><dt>Source</dt><dd>{record.sourceContact}</dd></div>
                <div><dt>Verified</dt><dd>{record.verificationTimestamp}</dd></div>
                <div><dt>Procedure/service</dt><dd>{formatProcedure(record.procedureOffered)}</dd></div>
                <div><dt>General availability</dt><dd>{displayValue(record.reportedGeneralAvailability)}</dd></div>
                <div><dt>Stated medical charge</dt><dd>{record.statedMedicalChargeMxn === null ? emptyValue : `${record.statedMedicalChargeMxn} MXN`}</dd></div>
                <div><dt>Charge exclusions</dt><dd>{displayValue(record.statedChargeExclusions)}</dd></div>
                <div><dt>Prerequisites</dt><dd>{displayValue(record.prerequisites)}</dd></div>
                <div><dt>Acceptance/referral rules</dt><dd>{displayValue(record.acceptanceReferralRules)}</dd></div>
                <div><dt>Freshness</dt><dd>{record.freshnessStatus === "CURRENTLY_REPORTED" ? "Currently reported" : record.freshnessStatus === "NOT_RECENTLY_VERIFIED" ? "Not recently verified" : "Not confirmed"}</dd></div>
              </dl>
            ) : (
              <p className="empty-state">No current approved Facility Verification Record. Create and approve one above.</p>
            )}
            <aside className="stale-example">
              <p className="kicker">Required uncertainty example</p>
              <h4>{staleFacilityRecord.facilityName} · Not recently verified</h4>
              <p>
                General availability: Not confirmed · Stated medical charge: Not confirmed · Source: {staleFacilityRecord.sourceContact}
              </p>
              <p>This old simulated record is not presented as current availability or as an appointment.</p>
            </aside>
          </article>

          <article className="view-card" aria-labelledby="booking-title">
            <div className="card-topline">
              <span className="view-number">04</span>
              <span className="eyebrow">State separation</span>
            </div>
            <h3 id="booking-title">Booking status</h3>
            <p className="state-label">Current state: <strong>{workflowState.replaceAll("_", " ")}</strong></p>
            {!closed && <div className="workflow-controls">
              <fieldset><legend>Patient scheduling choice</legend>
                <p>Minimum disclosure: simulated patient label, contact preference, and provider-documented procedure to {selectedFacility.name}.</p>
                <button type="button" onClick={() => setConsentStatus("GIVEN")}>Give facility/procedure-specific consent</button>
                <button className="secondary" type="button" onClick={() => setConsentStatus("REFUSED")}>Refuse and stop contact</button>
              </fieldset>
              <label className="demo-toggle"><input type="checkbox" checked={supportPermission} onChange={(event) => setSupportPermission(event.target.checked)} /> Separately authorize simulated support person (off by default)</label>
              <button type="button" disabled={!consentMatches(workflowInput) || workflowState !== "FACILITY_REPORTED"} onClick={() => setRequested(true)}>Human navigator: request appointment</button>
              {requested && <fieldset><legend>Simulated facility response</legend>
                <button type="button" onClick={() => { setFacilityResponse("DENIED"); setConfirmation(null); }}>Denied / unavailable</button>
                <button className="secondary" type="button" onClick={() => { setFacilityResponse("UNSUPPORTED_DOCUMENT"); setConfirmation(null); }}>Clinical document required through navigator</button>
                <form onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); setFacilityResponse("NONE"); setConfirmation({reservedDate:String(data.get("reservedDate")), reservedTime:String(data.get("reservedTime")), confirmationSource:String(data.get("confirmationSource"))}); }}>
                  <input name="reservedDate" type="date" required aria-label="Reserved date" />
                  <input name="reservedTime" type="time" required aria-label="Reserved time" />
                  <input name="confirmationSource" required maxLength={160} placeholder="Simulated facility confirmation source" aria-label="Confirmation source" />
                  <button type="submit">Record confirmation evidence</button>
                </form>
                {confirmation && <button className="secondary" type="button" onClick={() => setConfirmation(null)}>Remove confirmation evidence (test invalidation)</button>}
              </fieldset>}
              {consentStatus === "GIVEN" && <button className="danger" type="button" onClick={() => setConsentStatus("REVOKED")}>Revoke consent and stop all contact</button>}
            </div>}
            {closed && <div className="closed-state"><strong>Honored patient choice — case closed immediately.</strong><p>Navigator contact, reminders, support-person contact, and alternate-channel contact are stopped. This is not navigator failure.</p></div>}
            {workflowState === "BOOKING_BLOCKED_UNSUPPORTED_DOCUMENT_CHANNEL" && <p className="error">Booking blocked: clinical document required through an unsupported channel. In a real workflow, the patient/provider would use the official facility/provider channel. This prototype does not upload or handle clinical documents.</p>}
            {workflowState === "FACILITY_DENIED_OR_UNAVAILABLE" && <p className="error">Facility denied the request or cannot offer a slot. The appointment remains unconfirmed; no alternate facility is invented.</p>}
            <ol className="status-row">
              <li>Facility-reported information</li>
              <li>Appointment requested</li>
              <li>Appointment confirmed</li>
            </ol>
            <p className="boundary-copy">
              This milestone does not perform booking. Facility-reported information is not an appointment,
              and general availability is not a reserved patient slot.
            </p>
            <strong>Appointment confirmed ≠ completed colposcopy.</strong>
          </article>
        </div>
      </section>

      <footer>
        <p>All people, facilities, calls, prices, timestamps, and booking evidence shown here are simulated.</p>
        <p>Classroom workflow mechanics only; no clinical-effectiveness claim.</p>
      </footer>
    </main>
  );
}
