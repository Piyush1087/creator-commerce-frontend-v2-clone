export type CollaborationEmptyWorkspaceState = "empty-inbox" | "no-selection";

const EMPTY_WORKSPACE_COPY: Record<
  CollaborationEmptyWorkspaceState,
  { title: string; body: string }
> = {
  "empty-inbox": {
    title: "No collaborations yet",
    body: "New collaboration conversations will appear in the Inbox when they are available.",
  },
  "no-selection": {
    title: "Select a collaboration",
    body: "Choose a collaboration from the Inbox to view messages, execution progress and next actions.",
  },
};

export function collaborationEmptyWorkspaceCopy(
  state: CollaborationEmptyWorkspaceState,
) {
  return EMPTY_WORKSPACE_COPY[state];
}
