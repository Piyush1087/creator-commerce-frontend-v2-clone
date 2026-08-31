export const INSTAGRAM_PROVIDERS = [
  "INSTAGRAM",
  "META_BUSINESS_SUITE",
] as const;
export type InstagramProvider = (typeof INSTAGRAM_PROVIDERS)[number];

export const INSTAGRAM_LEGACY_STATUSES = [
  "CONNECTED",
  "PARTIALLY_CONNECTED",
  "TOKEN_EXPIRED",
  "DISCONNECTED",
] as const;
export type InstagramLegacyStatus = (typeof INSTAGRAM_LEGACY_STATUSES)[number];

export const INSTAGRAM_AUTHORIZATION_HEALTH = [
  "DISCONNECTED",
  "CONNECTED_FULL",
  "PARTIALLY_CONNECTED",
  "NEEDS_REVALIDATION",
  "PROVIDER_ACCESS_BLOCKED",
  "UNKNOWN",
] as const;
export type InstagramAuthorizationHealth =
  (typeof INSTAGRAM_AUTHORIZATION_HEALTH)[number];

export const INSTAGRAM_CAPABILITY_STATES = [
  "YES",
  "NO",
  "UNKNOWN",
  "DEFERRED",
] as const;
export type InstagramCapabilityState =
  (typeof INSTAGRAM_CAPABILITY_STATES)[number];

export const INSTAGRAM_OAUTH_INTENTS = [
  "INITIAL_CONNECT",
  "RECONNECT",
  "ACCOUNT_CHANGE",
  "LEGACY_IDENTITY_RECONCILIATION",
] as const;
export type InstagramOAuthIntent = (typeof INSTAGRAM_OAUTH_INTENTS)[number];

export const INSTAGRAM_DELETION_STATES = [
  "REQUESTED",
  "FENCED",
  "IN_PROGRESS",
  "COMPLETED",
  "FAILED_RETRYABLE",
  "FAILED_TERMINAL",
] as const;
export type InstagramDeletionState = (typeof INSTAGRAM_DELETION_STATES)[number];

export const INSTAGRAM_HANDLE_PROVENANCE = [
  "META_DIRECT",
  "USER_ENTERED",
  "WEBSITE_DERIVED",
  "LEGACY_UNKNOWN",
] as const;
export type InstagramHandleProvenance =
  (typeof INSTAGRAM_HANDLE_PROVENANCE)[number];

export const INSTAGRAM_INTEGRATION_SCOPES = [
  "BASIC_PROFILE",
  "ENGAGEMENT_INSIGHTS",
  "TARGETED_OUTREACH",
] as const;
export type InstagramIntegrationScope =
  (typeof INSTAGRAM_INTEGRATION_SCOPES)[number];

export type InstagramAllowedActions = {
  read: boolean;
  initialConnect: boolean;
  sameIdReconnect: boolean;
  controlledAccountChange: boolean;
  disconnect: boolean;
  deleteMyData: boolean;
  legacyIdentityReconciliation: boolean;
};

export type InstagramIntegrationRow = {
  id: string;
  provider: InstagramProvider;
  status: InstagramLegacyStatus;
  currentPlatformHandle: string | null;
  inboundOauthHandle: string | null;
  scopes: InstagramIntegrationScope[];
  tokenExpiresAt: string | null;
  tokenIssuedAt: string | null;
  tokenLastRefreshedAt: string | null;
  isActive: boolean;
  authorizationHealth: InstagramAuthorizationHealth;
  identityVerification: "UNVERIFIED" | "VERIFIED";
  providerAccountId: string | null;
  providerAppScopedUserId: string | null;
  currentProviderDisplayIdentity: string | null;
  capabilities: {
    firstPartyProfile: InstagramCapabilityState;
    firstPartyInsights: InstagramCapabilityState;
    businessDiscovery: InstagramCapabilityState;
    creatorMarketplaceDiscovery: InstagramCapabilityState;
  };
  humanActionRequired: boolean;
  syncHealth: "NOT_CONFIGURED";
  authorizationGeneration: number;
  allowedActions: InstagramAllowedActions;
};

export type InstagramDeletionSummary = {
  requestId: string;
  state: InstagramDeletionState;
  requestedAt: string;
};

export type InstagramIntegrationsReadModel = {
  layoutCase: "FULL_INSTAGRAM" | "PARTIAL_INSTAGRAM" | "SKIPPED";
  scrapedHandle: string | null;
  igHandleProvenance: InstagramHandleProvenance;
  socialSyncSkipped: boolean;
  integrations: InstagramIntegrationRow[];
  instagram: InstagramIntegrationRow | null;
  metaBusinessSuite: InstagramIntegrationRow | null;
  deletion: InstagramDeletionSummary | null;
};

export type InstagramOAuthUrlResponse = {
  url: string;
  state: string;
  finalizedHandle: string | null;
  intent: InstagramOAuthIntent;
  expectedGeneration: number;
};

export type InstagramConnectSuccess = {
  conflict: false;
  connected: true;
  integrationId: string;
  handle: string;
  status: InstagramLegacyStatus;
  authorizationHealth: InstagramAuthorizationHealth;
  scopes: InstagramIntegrationScope[];
  providerAccountId: string;
};

export type InstagramAccountChangeRequired = {
  conflict: true;
  code: "ACCOUNT_CHANGE_REQUIRED";
  integrationId: string;
  currentPlatformHandle: string | null;
  inboundOauthHandle: string;
  message: string;
};

export type InstagramConnectResponse =
  | InstagramConnectSuccess
  | InstagramAccountChangeRequired;

export type InstagramDeletionReceipt = {
  requestId: string;
  confirmationCode: string;
  state: InstagramDeletionState;
  requestedAt: string;
  completedAt: string | null;
  result: {
    deleted: string[];
    sanitized: string[];
    retained: string[];
  } | null;
  policyVersion: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isCanonicalString<T extends readonly string[]>(
  values: T,
  value: unknown,
): value is T[number] {
  return typeof value === "string" && values.includes(value as T[number]);
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isHttpUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function isAllowedActions(value: unknown): value is InstagramAllowedActions {
  if (!isRecord(value)) return false;
  return [
    "read",
    "initialConnect",
    "sameIdReconnect",
    "controlledAccountChange",
    "disconnect",
    "deleteMyData",
    "legacyIdentityReconciliation",
  ].every((key) => typeof value[key] === "boolean");
}

function isCapabilities(
  value: unknown,
): value is InstagramIntegrationRow["capabilities"] {
  if (!isRecord(value)) return false;
  return [
    "firstPartyProfile",
    "firstPartyInsights",
    "businessDiscovery",
    "creatorMarketplaceDiscovery",
  ].every((key) => isCanonicalString(INSTAGRAM_CAPABILITY_STATES, value[key]));
}

export function isInstagramIntegrationRow(
  value: unknown,
): value is InstagramIntegrationRow {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    isCanonicalString(INSTAGRAM_PROVIDERS, value.provider) &&
    isCanonicalString(INSTAGRAM_LEGACY_STATUSES, value.status) &&
    isNullableString(value.currentPlatformHandle) &&
    isNullableString(value.inboundOauthHandle) &&
    Array.isArray(value.scopes) &&
    value.scopes.every((scope) =>
      isCanonicalString(INSTAGRAM_INTEGRATION_SCOPES, scope),
    ) &&
    isNullableString(value.tokenExpiresAt) &&
    isNullableString(value.tokenIssuedAt) &&
    isNullableString(value.tokenLastRefreshedAt) &&
    typeof value.isActive === "boolean" &&
    isCanonicalString(
      INSTAGRAM_AUTHORIZATION_HEALTH,
      value.authorizationHealth,
    ) &&
    (value.identityVerification === "UNVERIFIED" ||
      value.identityVerification === "VERIFIED") &&
    isNullableString(value.providerAccountId) &&
    isNullableString(value.providerAppScopedUserId) &&
    isNullableString(value.currentProviderDisplayIdentity) &&
    isCapabilities(value.capabilities) &&
    typeof value.humanActionRequired === "boolean" &&
    value.syncHealth === "NOT_CONFIGURED" &&
    Number.isInteger(value.authorizationGeneration) &&
    isAllowedActions(value.allowedActions)
  );
}

export function isInstagramDeletionSummary(
  value: unknown,
): value is InstagramDeletionSummary {
  if (!isRecord(value)) return false;
  return (
    typeof value.requestId === "string" &&
    isCanonicalString(INSTAGRAM_DELETION_STATES, value.state) &&
    typeof value.requestedAt === "string"
  );
}

export function isInstagramIntegrationsReadModel(
  value: unknown,
): value is InstagramIntegrationsReadModel {
  if (!isRecord(value)) return false;
  const instagram = value.instagram;
  const metaBusinessSuite = value.metaBusinessSuite;
  return (
    (value.layoutCase === "FULL_INSTAGRAM" ||
      value.layoutCase === "PARTIAL_INSTAGRAM" ||
      value.layoutCase === "SKIPPED") &&
    isNullableString(value.scrapedHandle) &&
    isCanonicalString(INSTAGRAM_HANDLE_PROVENANCE, value.igHandleProvenance) &&
    typeof value.socialSyncSkipped === "boolean" &&
    Array.isArray(value.integrations) &&
    value.integrations.every(isInstagramIntegrationRow) &&
    (instagram === null ||
      (isInstagramIntegrationRow(instagram) &&
        instagram.provider === "INSTAGRAM")) &&
    (metaBusinessSuite === null ||
      (isInstagramIntegrationRow(metaBusinessSuite) &&
        metaBusinessSuite.provider === "META_BUSINESS_SUITE")) &&
    (value.deletion === null || isInstagramDeletionSummary(value.deletion))
  );
}

export function isInstagramOAuthUrlResponse(
  value: unknown,
): value is InstagramOAuthUrlResponse {
  if (!isRecord(value)) return false;
  return (
    isHttpUrl(value.url) &&
    typeof value.state === "string" &&
    /^[A-Za-z0-9_-]{43}$/.test(value.state) &&
    isNullableString(value.finalizedHandle) &&
    isCanonicalString(INSTAGRAM_OAUTH_INTENTS, value.intent) &&
    Number.isInteger(value.expectedGeneration)
  );
}

export function isInstagramConnectResponse(
  value: unknown,
): value is InstagramConnectResponse {
  if (!isRecord(value) || typeof value.conflict !== "boolean") return false;
  if (value.conflict) {
    return (
      value.code === "ACCOUNT_CHANGE_REQUIRED" &&
      typeof value.integrationId === "string" &&
      isNullableString(value.currentPlatformHandle) &&
      typeof value.inboundOauthHandle === "string" &&
      typeof value.message === "string"
    );
  }
  return (
    value.connected === true &&
    typeof value.integrationId === "string" &&
    typeof value.handle === "string" &&
    isCanonicalString(INSTAGRAM_LEGACY_STATUSES, value.status) &&
    isCanonicalString(
      INSTAGRAM_AUTHORIZATION_HEALTH,
      value.authorizationHealth,
    ) &&
    Array.isArray(value.scopes) &&
    value.scopes.every((scope) =>
      isCanonicalString(INSTAGRAM_INTEGRATION_SCOPES, scope),
    ) &&
    typeof value.providerAccountId === "string"
  );
}

export function isInstagramDeletionReceipt(
  value: unknown,
): value is InstagramDeletionReceipt {
  if (!isRecord(value)) return false;
  const result = value.result;
  const validResult =
    result === null ||
    (isRecord(result) &&
      ["deleted", "sanitized", "retained"].every(
        (key) =>
          Array.isArray(result[key]) &&
          result[key].every((item) => typeof item === "string"),
      ));
  return (
    typeof value.requestId === "string" &&
    typeof value.confirmationCode === "string" &&
    isCanonicalString(INSTAGRAM_DELETION_STATES, value.state) &&
    typeof value.requestedAt === "string" &&
    isNullableString(value.completedAt) &&
    typeof value.policyVersion === "string" &&
    validResult
  );
}
