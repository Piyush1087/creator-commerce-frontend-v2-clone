import { AlertTriangle, LoaderCircle, MessageCircle } from "lucide-react";

import {
  collaborationEmptyWorkspaceCopy,
  type CollaborationEmptyWorkspaceState,
} from "../utils/collaboration-empty-workspace";

export function CollaborationEmptyWorkspace({
  state,
}: {
  state: CollaborationEmptyWorkspaceState;
}) {
  const copy = collaborationEmptyWorkspaceCopy(state);

  return (
    <section className="collab-workspace__empty-surface">
      <span className="collab-workspace__empty-icon" aria-hidden="true">
        {state === "loading" ? <LoaderCircle className="collab-state-surface__spinner" size={34} strokeWidth={1.6} /> : state === "read-error" ? <AlertTriangle size={34} strokeWidth={1.6} /> : <MessageCircle size={38} strokeWidth={1.6} />}
      </span>
      <h2>{copy.title}</h2>
      <p>{copy.body}</p>
    </section>
  );
}
