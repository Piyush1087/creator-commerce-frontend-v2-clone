import { CampaignError } from "../api/c03-client";

import { reasonCopy } from "./c03-reasons";
export function messageForReason(reason: string | null) {
  return reason
    ? (reasonCopy[reason] ??
        "This action is currently unavailable. Refresh or try again later.")
    : "This action is currently unavailable.";
}
export function messageForError(error: unknown) {
  if (!(error instanceof CampaignError))
    return "The request could not be completed. Try again.";
  if (error.code && reasonCopy[error.code]) return reasonCopy[error.code];
  if (error.status === 401) return "Your session ended. Sign in again.";
  if (error.status === 403)
    return "Your Creator workspace access changed. Reload to verify access.";
  if (error.status === 404)
    return "This item is unavailable for the current workspace.";
  if (error.status === 429)
    return "Too many requests. Wait a moment before trying again.";
  if (error.uncertain)
    return "The result could not be confirmed. Retry the same command to check its outcome.";
  return "The response could not be verified. Refresh or try again later.";
}
