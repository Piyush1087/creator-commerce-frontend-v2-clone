export const CREATOR_INSTAGRAM_LIFECYCLE_STATES = [
  "NOT_CONNECTED",
  "CONNECTED_HEALTHY",
  "REVALIDATION_REQUIRED",
  "RECONNECT_REQUIRED",
  "PROVIDER_BLOCKED_RECOVERABLE",
  "DISCONNECTED_IDENTITY_RETAINED",
] as const;

export type CreatorInstagramLifecycleState =
  (typeof CREATOR_INSTAGRAM_LIFECYCLE_STATES)[number];

export const CREATOR_INSTAGRAM_AUTHORIZATION_HEALTH = [
  "NOT_CONNECTED",
  "USABLE",
  "REAUTHORIZATION_REQUIRED",
  "PROVIDER_ACCESS_BLOCKED",
  "UNKNOWN",
  "DISCONNECTED",
] as const;

export type CreatorInstagramAuthorizationHealth =
  (typeof CREATOR_INSTAGRAM_AUTHORIZATION_HEALTH)[number];

export const CREATOR_INSTAGRAM_CAPABILITY_STATES = [
  "NOT_CONNECTED",
  "AVAILABLE",
  "UNAVAILABLE",
  "UNKNOWN",
] as const;

export type CreatorInstagramCapabilityState =
  (typeof CREATOR_INSTAGRAM_CAPABILITY_STATES)[number];

export type CreatorInstagramSettingsReadModel = {
  platform: "INSTAGRAM";
  lifecycleState: CreatorInstagramLifecycleState;
  identity: {
    retained: boolean;
    handle: string | null;
    displayTitle: string | null;
    avatarUrl: string | null;
  };
  authorization: {
    health: CreatorInstagramAuthorizationHealth;
    reasonCode: string | null;
    basicCapability: CreatorInstagramCapabilityState;
    insightsCapability: CreatorInstagramCapabilityState;
    tokenExpiresAt: string | null;
    lastValidatedAt: string | null;
    lastMetadataSyncAt: string | null;
  };
  allowedActions: {
    initialConnect: boolean;
    revalidate: boolean;
    sameIdReconnect: boolean;
    disconnect: boolean;
  };
  recovery: {
    settingsAvailable: true;
    permanentIdentityRequired: true;
    differentAccountRequiresManualReview: true;
  };
};

export type CreatorInstagramReconnectAuthorization = {
  authorizationUrl: string;
  flow: "SAME_ID_RECONNECT";
};

export type CreatorInstagramCallbackBody = {
  state: string;
  code?: string;
  error?: string;
  errorDescription?: string;
};

export type CreatorInstagramMutationResponse = {
  settings: CreatorInstagramSettingsReadModel;
  revalidated?: boolean;
  connected?: boolean;
  disconnected?: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isValue<T extends readonly string[]>(
  values: T,
  value: unknown,
): value is T[number] {
  return typeof value === "string" && values.includes(value as T[number]);
}

export function isCreatorInstagramSettingsReadModel(
  value: unknown,
): value is CreatorInstagramSettingsReadModel {
  if (!isRecord(value) || value.platform !== "INSTAGRAM") return false;
  if (
    !isValue(CREATOR_INSTAGRAM_LIFECYCLE_STATES, value.lifecycleState) ||
    !isRecord(value.identity) ||
    typeof value.identity.retained !== "boolean" ||
    !isNullableString(value.identity.handle) ||
    !isNullableString(value.identity.displayTitle) ||
    !isNullableString(value.identity.avatarUrl) ||
    !isRecord(value.authorization) ||
    !isValue(
      CREATOR_INSTAGRAM_AUTHORIZATION_HEALTH,
      value.authorization.health,
    ) ||
    !isNullableString(value.authorization.reasonCode) ||
    !isValue(
      CREATOR_INSTAGRAM_CAPABILITY_STATES,
      value.authorization.basicCapability,
    ) ||
    !isValue(
      CREATOR_INSTAGRAM_CAPABILITY_STATES,
      value.authorization.insightsCapability,
    ) ||
    !isNullableString(value.authorization.tokenExpiresAt) ||
    !isNullableString(value.authorization.lastValidatedAt) ||
    !isNullableString(value.authorization.lastMetadataSyncAt) ||
    !isRecord(value.allowedActions) ||
    typeof value.allowedActions.initialConnect !== "boolean" ||
    typeof value.allowedActions.revalidate !== "boolean" ||
    typeof value.allowedActions.sameIdReconnect !== "boolean" ||
    typeof value.allowedActions.disconnect !== "boolean" ||
    !isRecord(value.recovery)
  ) {
    return false;
  }
  return (
    value.recovery.settingsAvailable === true &&
    value.recovery.permanentIdentityRequired === true &&
    value.recovery.differentAccountRequiresManualReview === true
  );
}

export function isCreatorInstagramReconnectAuthorization(
  value: unknown,
): value is CreatorInstagramReconnectAuthorization {
  if (!isRecord(value) || value.flow !== "SAME_ID_RECONNECT") return false;
  if (typeof value.authorizationUrl !== "string") return false;
  try {
    const url = new URL(value.authorizationUrl);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

export function isCreatorInstagramMutationResponse(
  value: unknown,
): value is CreatorInstagramMutationResponse {
  return isRecord(value) && isCreatorInstagramSettingsReadModel(value.settings);
}
