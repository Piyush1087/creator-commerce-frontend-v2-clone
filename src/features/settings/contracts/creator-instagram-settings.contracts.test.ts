import { describe, expect, it } from "vitest";

import {
  isCreatorInstagramReconnectAuthorization,
  isCreatorInstagramSettingsReadModel,
} from "./creator-instagram-settings.contracts";
import { creatorInstagramSettingsFixture } from "../mock/creator-instagram-settings.fixture";

describe("Creator Instagram Settings contracts", () => {
  it("accepts the canonical Instagram-only read model", () => {
    expect(
      isCreatorInstagramSettingsReadModel(creatorInstagramSettingsFixture()),
    ).toBe(true);
  });

  it("fails closed on future lifecycle or weakened identity policy values", () => {
    expect(
      isCreatorInstagramSettingsReadModel({
        ...creatorInstagramSettingsFixture(),
        lifecycleState: "ACCOUNT_REPLACED",
      }),
    ).toBe(false);
    expect(
      isCreatorInstagramSettingsReadModel({
        ...creatorInstagramSettingsFixture(),
        recovery: {
          settingsAvailable: true,
          permanentIdentityRequired: false,
          differentAccountRequiresManualReview: true,
        },
      }),
    ).toBe(false);
  });

  it("accepts only secure same-ID reconnect authorizations", () => {
    expect(
      isCreatorInstagramReconnectAuthorization({
        authorizationUrl: "https://www.instagram.com/oauth/authorize?state=x",
        flow: "SAME_ID_RECONNECT",
      }),
    ).toBe(true);
    expect(
      isCreatorInstagramReconnectAuthorization({
        authorizationUrl: "http://www.instagram.com/oauth/authorize?state=x",
        flow: "SAME_ID_RECONNECT",
      }),
    ).toBe(false);
    expect(
      isCreatorInstagramReconnectAuthorization({
        authorizationUrl: "https://www.instagram.com/oauth/authorize?state=x",
        flow: "ACCOUNT_CHANGE",
      }),
    ).toBe(false);
  });
});
