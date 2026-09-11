import { NextResponse } from "next/server";
import { aiFacilityProposalSchema, facilityNotesRequestSchema } from "../../../lib/schemas";

export const prohibitedPatientContent = /\b(patient|paciente|case\s*id|referral\s*(text|document)|screening\s*result|pathology|clinical\s*note|medical\s*record|phone\s*(number)?|tel[eé]fono)\b|\b\d{3}[-. ]?\d{3}[-. ]?\d{4}\b/i;
const geminiModel = "gemini-3.6-flash";

function logGeminiDiagnostic(details: {
  httpStatus: number | null;
  errorStatus: string | null;
  errorMessage: string | null;
  bodyParsedAsJson: boolean;
}) {
  console.error("Gemini upstream diagnostic", {
    geminiUpstreamHttpStatus: details.httpStatus,
    geminiUpstreamErrorStatus: details.errorStatus,
    geminiUpstreamErrorMessage: details.errorMessage,
    modelName: geminiModel,
    responseBodyParsedAsJson: details.bodyParsedAsJson,
  });
}

export async function POST(request: Request) {
  const parsedRequest = facilityNotesRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsedRequest.success) return NextResponse.json({ error: "Enter 20–3000 characters of simulated facility-level call notes." }, { status: 400 });
  if (prohibitedPatientContent.test(parsedRequest.data.notes)) return NextResponse.json({ error: "AI path blocked: notes may contain patient-level or clinical-document information. Continue with manual entry." }, { status: 400 });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "AI assistance is unavailable. Continue with manual entry." }, { status: 503 });

  const prompt = `Extract only facts explicitly supported by these SIMULATED FACILITY-LEVEL CALL NOTES. Do not infer patient facts, eligibility, urgency, diagnosis, or missing information. Use null or NOT_CONFIRMED when absent. Notes:\n${parsedRequest.data.notes}`;
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`, {
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
    const responseText = await response.text();
    let payload: unknown;
    let bodyParsedAsJson = false;
    try {
      payload = JSON.parse(responseText);
      bodyParsedAsJson = true;
    } catch {
      payload = null;
    }
    if (!response.ok) {
      const upstreamError = payload && typeof payload === "object" && "error" in payload
        ? (payload as { error?: { status?: unknown; message?: unknown } }).error
        : undefined;
      logGeminiDiagnostic({
        httpStatus: response.status,
        errorStatus: typeof upstreamError?.status === "string" ? upstreamError.status : null,
        errorMessage: typeof upstreamError?.message === "string" ? upstreamError.message : null,
        bodyParsedAsJson,
      });
      throw new Error("Gemini request failed");
    }
    if (!bodyParsedAsJson) {
      logGeminiDiagnostic({ httpStatus: response.status, errorStatus: null, errorMessage: null, bodyParsedAsJson });
      throw new Error("Invalid upstream JSON");
    }
    const geminiPayload = payload as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: unknown }> } }>;
    };
    const candidateText = geminiPayload.candidates?.[0]?.content?.parts?.[0]?.text;
    const text = typeof candidateText === "string" ? candidateText : "";
    const proposal = aiFacilityProposalSchema.safeParse(JSON.parse(text));
    if (!proposal.success) throw new Error("Invalid Gemini output");
    return NextResponse.json({ proposal: proposal.data });
  } catch (error) {
    if (error instanceof TypeError) {
      logGeminiDiagnostic({ httpStatus: null, errorStatus: null, errorMessage: error.message, bodyParsedAsJson: false });
    }
    return NextResponse.json({ error: "AI proposal failed validation or service access. Nothing was published; continue manually." }, { status: 502 });
  }
}
