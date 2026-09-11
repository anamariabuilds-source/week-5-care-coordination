import { NextResponse } from "next/server";
import { aiFacilityProposalSchema, facilityNotesRequestSchema } from "../../../lib/schemas";

export const prohibitedPatientContent = /\b(patient|paciente|case\s*id|referral\s*(text|document)|screening\s*result|pathology|clinical\s*note|medical\s*record|phone\s*(number)?|tel[eé]fono)\b|\b\d{3}[-. ]?\d{3}[-. ]?\d{4}\b/i;

export async function POST(request: Request) {
  const parsedRequest = facilityNotesRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsedRequest.success) return NextResponse.json({ error: "Enter 20–3000 characters of simulated facility-level call notes." }, { status: 400 });
  if (prohibitedPatientContent.test(parsedRequest.data.notes)) return NextResponse.json({ error: "AI path blocked: notes may contain patient-level or clinical-document information. Continue with manual entry." }, { status: 400 });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "AI assistance is unavailable. Continue with manual entry." }, { status: 503 });

  const prompt = `Extract only facts explicitly supported by these SIMULATED FACILITY-LEVEL CALL NOTES. Do not infer patient facts, eligibility, urgency, diagnosis, or missing information. Use null or NOT_CONFIRMED when absent. Notes:\n${parsedRequest.data.notes}`;
  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", responseSchema: {
          type: "OBJECT", properties: {
            procedureOffered: { type: "STRING", enum: ["COLPOSCOPY"], nullable: true }, serviceStatus: { type: "STRING", enum: ["REPORTED", "NOT_CONFIRMED"] },
            reportedGeneralAvailability: { type: "STRING", nullable: true }, statedMedicalChargeMxn: { type: "NUMBER", nullable: true }, statedChargeExclusions: { type: "STRING", nullable: true }, prerequisites: { type: "STRING", nullable: true }, acceptanceReferralRules: { type: "STRING", nullable: true }, freshnessStatus: { type: "STRING", enum: ["CURRENTLY_REPORTED", "NOT_RECENTLY_VERIFIED", "NOT_CONFIRMED"] },
          }, required: ["procedureOffered", "serviceStatus", "reportedGeneralAvailability", "statedMedicalChargeMxn", "statedChargeExclusions", "prerequisites", "acceptanceReferralRules", "freshnessStatus"]
        } }
      }),
    });
    if (!response.ok) throw new Error("Gemini request failed");
    const payload = await response.json();
    const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
    const proposal = aiFacilityProposalSchema.safeParse(JSON.parse(text));
    if (!proposal.success) throw new Error("Invalid Gemini output");
    return NextResponse.json({ proposal: proposal.data });
  } catch {
    return NextResponse.json({ error: "AI proposal failed validation or service access. Nothing was published; continue manually." }, { status: 502 });
  }
}
