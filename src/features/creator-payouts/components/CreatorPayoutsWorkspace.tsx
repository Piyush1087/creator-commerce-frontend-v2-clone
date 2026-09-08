import { Button } from "../../../design-system/aurora";
import { useCreatorPayouts } from "../hooks/use-creator-payouts";
import "../creator-payouts.css";

export function CreatorPayoutsWorkspace() {
  const { overview, obligations, history, method, accessDenied, refresh } =
    useCreatorPayouts();
  if (accessDenied)
    return (
      <main className="cp-workspace">
        <h1>Creator payouts</h1>
        <p>You do not have permission to view this payout workspace.</p>
      </main>
    );
  const loading = [overview, obligations, history, method].some(
    (resource) => resource.status === "INITIAL_LOADING",
  );
  return (
    <main className="cp-workspace" aria-busy={loading}>
      <header className="cp-workspace__header">
        <h1 className="cp-workspace__title">Creator payouts</h1>
        <Button variant="ghost" onClick={refresh}>
          Refresh
        </Button>
      </header>
      <p role="status" aria-live="polite">
        {loading ? "Loading payout information…" : "Payout information loaded."}
      </p>
    </main>
  );
}
