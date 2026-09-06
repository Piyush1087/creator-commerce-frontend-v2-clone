import { useState } from "react";
import { Alert, Button } from "../../../../design-system/aurora";
import { fetchCollaborationBriefPack } from "../../api/collaboration-client";
import type { CollaborationBriefPackV1 } from "../../contracts/collaboration.contracts";

export function CollaborationBriefPanel({
  collaborationId,
}: {
  collaborationId: string;
}) {
  const [pack, setPack] = useState<CollaborationBriefPackV1 | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const load = async () => {
    setBusy(true);
    setError(null);
    try {
      setPack(await fetchCollaborationBriefPack(collaborationId));
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Collaboration Brief could not be loaded.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="collab-exec-card" aria-labelledby="collab-brief-title">
      <h4 id="collab-brief-title">Collaboration Brief</h4>
      <p>Locked, snapshot-only execution context for this Collaboration.</p>
      {error ? (
        <Alert tone="error" title="Brief unavailable">
          {error}
        </Alert>
      ) : null}
      {!pack ? (
        <Button
          variant="secondary"
          disabled={busy}
          onClick={() => void load()}
          fullWidthOnMobile
        >
          {busy ? "Loading…" : "Open Collaboration Brief"}
        </Button>
      ) : (
        <div>
          <p>
            <strong>{pack.brief.deliverables.length}</strong> deliverable
            {pack.brief.deliverables.length === 1 ? "" : "s"}
          </p>
          <ol>
            {pack.brief.deliverables.map((item) => (
              <li key={item.sourceBriefDeliverableId}>
                Deliverable {item.displayOrder + 1}
                {item.publishingRequired ? " · publishing required" : ""}
              </li>
            ))}
          </ol>
          <small>
            Locked {new Date(pack.collaboration.lockedAt).toLocaleString()}
          </small>
        </div>
      )}
    </section>
  );
}
