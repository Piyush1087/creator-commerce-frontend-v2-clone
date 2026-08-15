import type { CollaborationDetailResponse } from "../contracts/collaboration.contracts";
import { collaborationCapabilities } from "./collaboration-capabilities";

export type CollaborationComposerMode = "enabled" | "read_only" | "unavailable";

export const MESSAGING_CLOSED_COPY = {
  title: "Messaging is closed for this collaboration.",
  body: "You can still view the conversation history.",
} as const;

export const EMPTY_MESSAGES_COPY = "No messages yet";

/**
 * Composer sendability comes only from backend `availableActions` → message capability.
 * Do not re-implement lifecycle locally.
 */
export function collaborationComposerMode(
  detail: CollaborationDetailResponse | null,
): CollaborationComposerMode {
  if (!detail) return "unavailable";
  return collaborationCapabilities(detail).has("message") ? "enabled" : "read_only";
}

export function collaborationCanSendMessage(
  detail: CollaborationDetailResponse | null,
  draft: string,
  sendInProgress: boolean,
): boolean {
  return (
    collaborationComposerMode(detail) === "enabled" &&
    draft.trim().length > 0 &&
    !sendInProgress
  );
}
