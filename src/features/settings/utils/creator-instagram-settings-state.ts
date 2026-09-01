import { CreatorInstagramSettingsApiError } from "../api/creator-instagram-settings-client";
import type {
  CreatorInstagramCapabilityState,
  CreatorInstagramLifecycleState,
} from "../contracts/creator-instagram-settings.contracts";

export const CREATOR_INSTAGRAM_PRESENTATION: Record<
  CreatorInstagramLifecycleState,
  {
    badge: string;
    title: string;
    description: string;
    tone: "success" | "pending" | "error" | "neutral";
  }
> = {
  NOT_CONNECTED: {
    badge: "Not connected",
    title: "No permanent Instagram identity",
    description:
      "Complete Instagram setup through Creator Entry before managing the connection here.",
    tone: "neutral",
  },
  CONNECTED_HEALTHY: {
    badge: "Connected",
    title: "Instagram connected",
    description:
      "The permanent Instagram identity and required profile permission are healthy.",
    tone: "success",
  },
  REVALIDATION_REQUIRED: {
    badge: "Check required",
    title: "Instagram status needs a fresh check",
    description:
      "Revalidate the existing authorization. The permanent identity will not change.",
    tone: "pending",
  },
  RECONNECT_REQUIRED: {
    badge: "Reconnect required",
    title: "Instagram authorization needs attention",
    description:
      "Reconnect the same permanent Instagram account to restore access.",
    tone: "error",
  },
  PROVIDER_BLOCKED_RECOVERABLE: {
    badge: "Provider unavailable",
    title: "Instagram access is temporarily blocked",
    description:
      "The permanent identity remains safe. Retry validation later or reconnect the same account.",
    tone: "pending",
  },
  DISCONNECTED_IDENTITY_RETAINED: {
    badge: "Disconnected",
    title: "Instagram disconnected",
    description:
      "Provider authorization is inactive, while the permanent identity remains for a safe same-account reconnect.",
    tone: "neutral",
  },
};

export function creatorInstagramCapabilityLabel(
  value: CreatorInstagramCapabilityState,
): string {
  if (value === "AVAILABLE") return "Available";
  if (value === "UNAVAILABLE") return "Unavailable";
  if (value === "NOT_CONNECTED") return "Not connected";
  return "Status unknown";
}

export function creatorInstagramFriendlyError(error: unknown): string {
  if (!(error instanceof CreatorInstagramSettingsApiError)) {
    return error instanceof Error
      ? error.message
      : "Instagram Settings could not complete the request.";
  }
  if (error.code === "INSTAGRAM_DIFFERENT_ACCOUNT_BLOCKED") {
    return "A different Instagram account was selected. The permanent account remains unchanged; contact support for manual review.";
  }
  if (error.code === "INSTAGRAM_AUTHORIZATION_STALE") {
    return "Instagram connection state changed. Reload Settings and start again.";
  }
  if (error.code === "INSTAGRAM_PROVIDER_RETRY_REQUIRED") {
    return "Instagram is temporarily unavailable. Your permanent identity remains safe; retry later.";
  }
  if (error.code === "INSTAGRAM_AUTHORIZATION_DENIED") {
    return "Instagram authorization was cancelled. Nothing changed.";
  }
  if (error.code === "INSTAGRAM_PROFESSIONAL_ACCOUNT_REQUIRED") {
    return "Reconnect an Instagram Professional Business or Creator account.";
  }
  if (error.code === "INSTAGRAM_RECONNECT_REQUIRED") {
    return "This connection is disconnected. Start a same-account reconnect.";
  }
  return error.message;
}
