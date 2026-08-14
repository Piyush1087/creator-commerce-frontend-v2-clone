export type CollaborationQuerySelection = {
  requestedId: string | null;
  source: "thread" | "collaboration" | null;
};

export function readCollaborationQuerySelection(
  params: Pick<URLSearchParams, "get">,
): CollaborationQuerySelection {
  const thread = params.get("thread")?.trim();
  if (thread) {
    return { requestedId: thread, source: "thread" };
  }
  const legacy = params.get("collaboration")?.trim();
  return legacy
    ? { requestedId: legacy, source: "collaboration" }
    : { requestedId: null, source: null };
}

export function resolveInboxSelection(
  rowIds: string[],
  currentId: string | null,
  requestedId: string | null,
): string | null {
  if (requestedId) {
    return requestedId;
  }
  if (currentId && rowIds.includes(currentId)) {
    return currentId;
  }
  return rowIds[0] ?? null;
}

export function collaborationThreadParams(threadId: string): URLSearchParams {
  return new URLSearchParams({ thread: threadId });
}
