import { describe, expect, it } from "vitest";
import { prohibitedPatientContent } from "./route";

describe("AI input boundary", () => {
  it("allows simulated facility operational notes", () => expect(prohibitedPatientContent.test("Simulated facility offers colposcopy. Referral required. Charge 1450 MXN.")).toBe(false));
  it.each(["Patient phone number 555-555-5555", "screening result attached", "case ID ABC-2", "clinical note text"])("blocks prohibited content: %s", (text) => expect(prohibitedPatientContent.test(text)).toBe(true));
});
