import type {
  InstagramAuthorizationHealth,
  InstagramCapabilityState,
  InstagramDeletionState,
  InstagramIntegrationRow,
} from "../contracts/instagram-integrations.contracts";
import { InstagramIntegrationsApiError } from "../api/instagram-integrations-client";

export const INSTAGRAM_CONNECTION_PRESENTATION: Record<
  InstagramAuthorizationHealth,
  {
    label: string;
    heading: string;
    description: string;
    tone: "success" | "pending" | "error" | "neutral";
  }
> = {
  CONNECTED_FULL: {
    label: "Connected",
    heading: "Instagram connected",
    description: "Profile access and first-party insights are available.",
    tone: "success",
  },
  PARTIALLY_CONNECTED: {
    label: "Connected with limited access",
    heading: "Instagram connected with limited access",
    description:
      "Profile connection is active. Insights are unavailable with the current authorization.",
    tone: "pending",
  },
  NEEDS_REVALIDATION: {
    label: "Reconnect required",
    heading: "Instagram authorization needs revalidation",
    description:
      "Start a fresh same-account authorization when user action is required.",
    tone: "error",
  },
  PROVIDER_ACCESS_BLOCKED: {
    label: "Temporarily unavailable",
    heading: "Instagram access temporarily unavailable",
    description:
      "Instagram is currently preventing access. Creator Shop will re-evaluate the connection state.",
    tone: "pending",
  },
  UNKNOWN: {
    label: "Status uncertain",
    heading: "Connection status uncertain",
    description:
      "Creator Shop cannot confirm the current provider authorization state. Reload to check again.",
    tone: "neutral",
  },
  DISCONNECTED: {
    label: "Disconnected",
    heading: "Instagram disconnected",
    description:
      "The known Instagram identity is retained for a safe same-account reconnect.",
    tone: "neutral",
  },
};

export function capabilityLabel(state: InstagramCapabilityState): string {
  if (state === "YES") return "Available";
  if (state === "NO") return "Unavailable";
  if (state === "DEFERRED") return "Separate capability";
  return "Status unknown";
}

export function hasPendingInstagramAccountChange(
  row: InstagramIntegrationRow,
): boolean {
  return Boolean(
    row.providerAccountId &&
      row.currentPlatformHandle &&
      row.inboundOauthHandle &&
      row.currentPlatformHandle !== row.inboundOauthHandle,
  );
}

export function deletionBlocksInstagramConnection(
  state: InstagramDeletionState,
): boolean {
  return ["REQUESTED", "FENCED", "IN_PROGRESS", "FAILED_RETRYABLE"].includes(
    state,
  );
}

export function deletionStatusCopy(state: InstagramDeletionState): string {
  if (state === "FAILED_RETRYABLE") {
    return "Deletion is still being processed and requires a backend retry.";
  }
  if (state === "FAILED_TERMINAL") {
    return "Deletion could not be completed. Contact support with the request time shown below.";
  }
  if (state === "COMPLETED")
    return "Instagram connection data deletion completed.";
  return "Instagram connection data deletion is in progress. New authorization is temporarily disabled.";
}

export type InstagramCallback =
  | { kind: "none" }
  | { kind: "ready"; code: string; state: string }
  | { kind: "error"; message: string };

export function parseInstagramCallback(
  params: URLSearchParams,
): InstagramCallback {
  const present = [
    "code",
    "state",
    "error",
    "error_reason",
    "error_description",
  ].some((key) => params.has(key));
  if (!present) return { kind: "none" };
  if (params.has("error")) {
    return {
      kind: "error",
      message:
        "Instagram authorization was declined. Start a new attempt when ready.",
    };
  }
  const code = params.get("code");
  const state = params.get("state");
  if (!code || !state) {
    return {
      kind: "error",
      message:
        "Instagram authorization is incomplete. Start a fresh authorization.",
    };
  }
  return { kind: "ready", code, state };
}

export function callbackScrubbedPath(href: string): string {
  const url = new URL(href);
  for (const key of [
    "code",
    "state",
    "error",
    "error_reason",
    "error_description",
  ]) {
    url.searchParams.delete(key);
  }
  const hash = url.hash === "#_" ? "" : url.hash;
  return `${url.pathname}${url.search}${hash}`;
}

export function friendlyInstagramError(error: unknown): string {
  if (!(error instanceof InstagramIntegrationsApiError)) {
    return error instanceof Error
      ? error.message
      : "Instagram request failed. Please try again.";
  }
  if (
    error.code === "STALE_INSTAGRAM_AUTHORIZATION_GENERATION" ||
    error.code === "STALE_INSTAGRAM_ACCOUNT_IDENTITY"
  ) {
    return "Connection state changed. Start a fresh authorization.";
  }
  if (error.code === "PERSONAL_ACCOUNT") {
    return "A Professional Instagram Business or Creator account is required.";
  }
  if (error.code === "ACCOUNT_CHANGE_REQUIRED") {
    return "A different Instagram account was selected. Brand Owner authorization is required in Settings.";
  }
  if (error.code === "INVALID_INSTAGRAM_OAUTH_INTENT") {
    return "This authorization no longer matches the current connection state. Start again.";
  }
  if (error.code === "INSTAGRAM_DELETION_IN_PROGRESS") {
    return "Instagram connection data deletion is in progress. Wait for it to finish before reconnecting.";
  }
  if (error.code === "LEGACY_IDENTITY_RECONCILIATION_REQUIRED") {
    return "The Brand Owner must reconcile this legacy Instagram identity in Settings.";
  }
  if (/role authority changed/i.test(error.message)) {
    return "Your workspace role changed during authorization. Reload and start again.";
  }
  return error.message;
}
