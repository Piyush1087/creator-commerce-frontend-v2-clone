import { describe, expect, it } from "vitest";

import {
  COLLABORATION_STAGES,
  collaborationStagePresentation,
} from "./collaboration-stage-progress";

describe("Collaboration stage progress", () => {
  it("uses the fixed five-stage workflow without a derived percentage", () => {
    expect(COLLABORATION_STAGES.map((stage) => stage.label)).toEqual([
      "Negotiation",
      "Securement",
      "Fulfillment",
      "Production",
      "Publishing",
    ]);
  });

  it("marks prior stages complete and the persisted stage current", () => {
    expect(
      collaborationStagePresentation("FULFILLMENT", "PRODUCTION", "ACTIVE"),
    ).toBe("complete");
    expect(
      collaborationStagePresentation("PRODUCTION", "PRODUCTION", "ACTIVE"),
    ).toBe("current");
    expect(
      collaborationStagePresentation(
        "PUBLISHING_SETTLEMENT",
        "PRODUCTION",
        "ACTIVE",
      ),
    ).toBe("upcoming");
  });

  it("shows every stage complete for a completed collaboration", () => {
    expect(
      collaborationStagePresentation(
        "NEGOTIATION",
        "PUBLISHING_SETTLEMENT",
        "COMPLETED",
      ),
    ).toBe("complete");
  });
});
