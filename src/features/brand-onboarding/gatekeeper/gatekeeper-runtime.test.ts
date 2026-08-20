import { describe, expect, it } from "vitest";
import {
  isSupportedGatekeeperIndustry,
  mapGatekeeperResultToViewState,
  parseGatekeeperResult,
} from "./gatekeeper-runtime";

describe("Gatekeeper runtime contract", () => {
  it("maps ADMITTED to the pre-scan confirmation state", () => {
    const parsed = parseGatekeeperResult({
      version: "gatekeeper_v1",
      decision: {
        outcome: "ADMITTED",
        reason_code: null,
        recovery_actions: ["CONTINUE"],
        manual_review_eligible: false,
      },
      assessment: { provisional_industry: "D2C" },
    });
    expect(parsed).not.toBeNull();
    expect(mapGatekeeperResultToViewState(parsed!).kind).toBe("PRE_SCAN_CONFIRMATION");
  });

  it("preserves an explicit recovery state and actions", () => {
    const parsed = parseGatekeeperResult({
      decision: {
        outcome: "CLASSIFICATION_UNCERTAIN",
        reason_code: "CONFLICTING_EVIDENCE",
        recovery_actions: ["REQUEST_CLASSIFICATION_REVIEW", "CONTACT_SUPPORT"],
        manual_review_eligible: true,
      },
    });
    expect(parsed?.decision.recovery_actions).toEqual([
      "REQUEST_CLASSIFICATION_REVIEW",
      "CONTACT_SUPPORT",
    ]);
    expect(mapGatekeeperResultToViewState(parsed!).kind).toBe("CLASSIFICATION_UNCERTAIN");
  });

  it("recognizes only the four supported MVP Industries", () => {
    expect(isSupportedGatekeeperIndustry("D2C")).toBe(true);
    expect(isSupportedGatekeeperIndustry("REAL_ESTATE")).toBe(false);
  });
});
