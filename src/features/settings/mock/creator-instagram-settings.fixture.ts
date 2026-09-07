import type { CreatorInstagramSettingsReadModel } from "../contracts/creator-instagram-settings.contracts";

export function creatorInstagramSettingsFixture(
  overrides: Partial<CreatorInstagramSettingsReadModel> = {},
): CreatorInstagramSettingsReadModel {
  return {
    platform: "INSTAGRAM",
    lifecycleState: "CONNECTED_HEALTHY",
    identity: {
      retained: true,
      handle: "creator_handle",
      displayTitle: "Creator Name",
      avatarUrl: "https://cdn.example.test/avatar.jpg",
    },
    authorization: {
      health: "USABLE",
      reasonCode: null,
      basicCapability: "AVAILABLE",
      insightsCapability: "AVAILABLE",
      tokenExpiresAt: "2030-01-01T00:00:00.000Z",
      lastValidatedAt: "2029-09-01T00:00:00.000Z",
      lastMetadataSyncAt: "2029-09-01T00:00:00.000Z",
    },
    allowedActions: {
      initialConnect: false,
      revalidate: true,
      sameIdReconnect: false,
      disconnect: true,
    },
    recovery: {
      settingsAvailable: true,
      permanentIdentityRequired: true,
      differentAccountRequiresManualReview: true,
    },
    ...overrides,
  };
}
