import { describe, expect, it } from "vitest";

import type { GatekeeperFrontendResult } from "../contracts/gatekeeper.contracts";
import { mapGatekeeperResultToViewState } from "./map-gatekeeper-result";

const base: Omit<GatekeeperFrontendResult, "outcome" | "recoveryActions"> = {
  reasonCode: null,
  manualReviewEligible: false,
  normalizedUrl: "https://brand.com",
  normalizedDomain: "brand.com",
  leadId: "lead-1",
  brandProfileId: null,
  provisionalIndustry: "D2C",
  message: null,
};

describe("mapGatekeeperResultToViewState", () => {
  it("keeps outcome identity distinct even when visual families are shared", () => {
    const unreachable = mapGatekeeperResultToViewState({ ...base, outcome: "DOMAIN_UNREACHABLE", recoveryActions: ["RETRY"] });
    const technical = mapGatekeeperResultToViewState({ ...base, outcome: "TECHNICAL_FAILURE", recoveryActions: ["RETRY"] });
    expect(unreachable.state).toBe("DOMAIN_UNREACHABLE");
    expect(technical.state).toBe("TECHNICAL_FAILURE");
    expect(unreachable.state).not.toBe(technical.state);
  });

  it("uses backend message only as presentation copy, never to determine state", () => {
    const mapped = mapGatekeeperResultToViewState({
      ...base,
      outcome: "CLASSIFICATION_UNCERTAIN",
      recoveryActions: ["REQUEST_CLASSIFICATION_REVIEW"],
      manualReviewEligible: true,
      message: "Sign in now",
    });
    expect(mapped.state).toBe("CLASSIFICATION_UNCERTAIN");
    expect(mapped.description).toBe("Sign in now");
  });
});
