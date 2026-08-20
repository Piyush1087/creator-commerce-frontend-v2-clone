import { describe, expect, it } from "vitest";

import { INDUSTRY_VERTICALS } from "../contracts/discovery.contracts";
import { SUPPORTED_GATEKEEPER_INDUSTRIES } from "../contracts/gatekeeper.contracts";
import { COMING_SOON_INDUSTRIES } from "./gatekeeper-industry-options";

describe("Gatekeeper confirmation Industry choices", () => {
  it("submits only Industry values accepted by the authoritative backend enum", () => {
    for (const industry of COMING_SOON_INDUSTRIES) {
      expect(INDUSTRY_VERTICALS).toContain(industry.value);
    }
  });

  it("keeps Coming Soon choices separate from supported MVP Industries", () => {
    for (const industry of COMING_SOON_INDUSTRIES) {
      expect(SUPPORTED_GATEKEEPER_INDUSTRIES).not.toContain(industry.value);
    }
  });
});
