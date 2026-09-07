import { describe, expect, it } from "vitest";

import { resolveCreatorHomeDestination } from "./creator-home-destination";

describe("Creator Home closed destinations", () => {
  it("maps only typed Creator routes and encodes collaboration IDs", () => {
    expect(
      resolveCreatorHomeDestination({ destinationId: "CREATOR_CAMPAIGNS" }),
    ).toBe("/creator/campaigns/opportunities");
    expect(
      resolveCreatorHomeDestination({
        destinationId: "CREATOR_APPLICATION_DETAIL",
        entityId: "app/id",
      }),
    ).toBe("/creator/campaigns/applications/app%2Fid");
    expect(
      resolveCreatorHomeDestination({
        destinationId: "CREATOR_COLLABORATION_THREAD",
        entityId: "thread&id",
      }),
    ).toBe("/creator/collaborations?thread=thread%26id");
    expect(
      resolveCreatorHomeDestination({
        destinationId: "CREATOR_OPPORTUNITY_DETAIL",
      }),
    ).toBeNull();
  });
});
