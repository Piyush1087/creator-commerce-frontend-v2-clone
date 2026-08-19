import { Alert, Button } from "../../../../design-system/aurora";

type Props = {
  busy: boolean;
  actionError: string | null;
  onCancel: () => void;
};

export function CreatorCancellationCard({ busy, actionError, onCancel }: Props) {
  const ask = () => {
    if (window.confirm("Are you sure you want to cancel this collaboration?")) {
      onCancel();
    }
  };

  return (
    <section className="collab-exec-card" aria-labelledby="collab-creator-cancel-title">
      <h4 id="collab-creator-cancel-title">Cancel collaboration</h4>
      <p>Cancelling ends active execution for this collaboration. Financial outcomes follow the saved resolution state.</p>
      <div className="collab-exec-actions" aria-busy={busy}>
        <Button variant="secondary" disabled={busy} onClick={ask} fullWidthOnMobile>
          {busy ? "Cancelling…" : "Cancel collaboration"}
        </Button>
      </div>
      {actionError ? (
        <Alert tone="error" title="Cancellation could not be completed">
          {actionError}
        </Alert>
      ) : null}
    </section>
  );
}
