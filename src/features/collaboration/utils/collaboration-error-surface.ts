export type CollaborationErrorSurface =
  | "INBOX_READ"
  | "DETAIL_READ"
  | "MESSAGES_READ"
  | "MESSAGE_SEND"
  | "EXECUTION_COMMAND"
  | "CONTRACT_READ"
  | "SESSION_AUTH"
  | "COLLABORATION_UNAVAILABLE"
  | "REALTIME_DEGRADED";

export type CollaborationPaneErrors = {
  inbox: string | null;
  detail: string | null;
  messages: string | null;
  send: string | null;
  execution: string | null;
  contract: string | null;
};

export const emptyCollaborationPaneErrors = (): CollaborationPaneErrors => ({
  inbox: null,
  detail: null,
  messages: null,
  send: null,
  execution: null,
  contract: null,
});

/** Map a failure onto the pane that owns recovery UI. */
export function assignCollaborationPaneError(
  surface: CollaborationErrorSurface,
  message: string,
  current: CollaborationPaneErrors,
): CollaborationPaneErrors {
  switch (surface) {
    case "INBOX_READ":
      return { ...current, inbox: message };
    case "DETAIL_READ":
      return { ...current, detail: message };
    case "MESSAGES_READ":
      return { ...current, messages: message };
    case "MESSAGE_SEND":
      return { ...current, send: message };
    case "EXECUTION_COMMAND":
      return { ...current, execution: message };
    case "CONTRACT_READ":
      return { ...current, contract: message };
    case "SESSION_AUTH":
    case "COLLABORATION_UNAVAILABLE":
    case "REALTIME_DEGRADED":
      return current;
  }
}

export function clearCollaborationPaneError(
  surface: CollaborationErrorSurface,
  current: CollaborationPaneErrors,
): CollaborationPaneErrors {
  switch (surface) {
    case "INBOX_READ":
      return { ...current, inbox: null };
    case "DETAIL_READ":
      return { ...current, detail: null };
    case "MESSAGES_READ":
      return { ...current, messages: null };
    case "MESSAGE_SEND":
      return { ...current, send: null };
    case "EXECUTION_COMMAND":
      return { ...current, execution: null };
    case "CONTRACT_READ":
      return { ...current, contract: null };
    default:
      return current;
  }
}

export function classifyCollaborationHttpFailure(status: number): CollaborationErrorSurface {
  if (status === 401) return "SESSION_AUTH";
  if (status === 404) return "COLLABORATION_UNAVAILABLE";
  return "DETAIL_READ";
}
