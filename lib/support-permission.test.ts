import { describe, expect, it } from "vitest";
import {
  initialSupportPersonPermission,
  updateSupportPersonPermission,
} from "./support-permission";

describe("support-person authorization", () => {
  it("is false on initial load", () => {
    expect(initialSupportPersonPermission).toBe(false);
  });

  it("does not turn on when scheduling consent is given", () => {
    expect(
      updateSupportPersonPermission(false, { type: "SCHEDULING_CONSENT_GIVEN" }),
    ).toBe(false);
  });

  it("becomes true only after the patient explicitly selects it", () => {
    expect(
      updateSupportPersonPermission(false, {
        type: "PATIENT_EXPLICITLY_SET",
        authorized: true,
      }),
    ).toBe(true);
  });

  it("is cleared when scheduling consent is refused or revoked", () => {
    expect(
      updateSupportPersonPermission(true, {
        type: "SCHEDULING_CONSENT_REFUSED_OR_REVOKED",
      }),
    ).toBe(false);
  });
});

