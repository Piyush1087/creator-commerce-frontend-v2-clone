import { RefreshCw } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { Alert, Badge, Button } from "../../../design-system/aurora";
import { AUTH_ROUTES } from "../../auth/constants";
import type { BrandPayoutsViewer } from "../contracts/brand-payouts.contracts";
import { resolvePayoutsDetailTarget } from "../hooks/use-brand-payouts-detail";
import { useBrandPayoutsWorkspace } from "../hooks/use-brand-payouts-workspace";
import { viewerRoleLabel } from "../utils/brand-payouts-presentation";
import { PayoutObligations } from "./PayoutObligations";
import { PayoutsActivity } from "./PayoutsActivity";
import { PayoutsDetail } from "./PayoutsDetail";
import { PayoutsOverview } from "./PayoutsOverview";
import { PayoutsTreasuryActions } from "./PayoutsTreasuryActions";
import "../brand-payouts.css";

export function BrandPayoutsWorkspace() {
  const location = useLocation();
  const workspace = useBrandPayoutsWorkspace();
  const target = resolvePayoutsDetailTarget(location.search);
  if (target && target !== "INVALID") {
    return <PayoutsDetail target={target} />;
  }
  if (target === "INVALID") {
    return (
      <div className="bp-workspace">
        <Alert tone="error" title="Invalid financial detail link">
          This link does not identify one safe Payouts resource.
        </Alert>
        <Link className="bp-detail-link" to={AUTH_ROUTES.brandPayouts} replace>
          Return to Payouts
        </Link>
      </div>
    );
  }
  return <PayoutsWorkspaceOverview workspace={workspace} />;
}

function PayoutsWorkspaceOverview({
  workspace,
}: {
  readonly workspace: ReturnType<typeof useBrandPayoutsWorkspace>;
}) {
  const viewers = [
    workspace.overview.data?.viewer,
    workspace.activity.data?.viewer,
    workspace.obligations.data?.viewer,
  ].filter((candidate): candidate is BrandPayoutsViewer => Boolean(candidate));
  const viewer = viewers[0] ?? null;
  const viewerConflict = viewers.some(
    (candidate) =>
      candidate.role !== viewer?.role ||
      candidate.projection_scope !== viewer?.projection_scope,
  );
  const refreshing =
    workspace.overview.status === "REFRESHING" ||
    workspace.activity.status === "REFRESHING" ||
    workspace.obligations.status === "REFRESHING";

  if (workspace.accessDenied) {
    return (
      <div className="bp-workspace">
        <header className="bp-workspace__header">
          <h1 className="bp-workspace__title">Payouts</h1>
        </header>
        <Alert tone="error" title="Brand financial access unavailable">
          Your current active Brand membership does not authorize this
          workspace.
        </Alert>
      </div>
    );
  }

  if (viewerConflict) {
    return (
      <div className="bp-workspace">
        <header className="bp-workspace__header">
          <h1 className="bp-workspace__title">Payouts</h1>
        </header>
        <Alert tone="error" title="Payouts snapshot could not be verified">
          Section responses disagreed about the active server-authorized role.
          Refresh before viewing financial data.
        </Alert>
        <Button variant="outline" onClick={workspace.refresh}>
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <main className="bp-workspace">
      <header className="bp-workspace__header">
        <div>
          <p className="bp-workspace__eyebrow">Brand financial operations</p>
          <h1 className="bp-workspace__title">Payouts</h1>
          <p className="bp-workspace__subtitle">
            One operational view of pooled funds, Creator obligations, and
            financial activity.
          </p>
        </div>
        <div className="bp-workspace__header-actions">
          {viewer ? (
            <Badge tone="neutral">{viewerRoleLabel(viewer.role)}</Badge>
          ) : null}
          <Button
            variant="outline"
            size="sm"
            onClick={workspace.refresh}
            disabled={refreshing}
          >
            <RefreshCw size={16} aria-hidden />
            {refreshing ? "Refreshing…" : "Refresh"}
          </Button>
        </div>
      </header>
      <PayoutsTreasuryActions
        state={workspace.overview}
        onRefresh={workspace.refresh}
      />
      <PayoutsOverview state={workspace.overview} onRetry={workspace.refresh} />
      <div className="bp-content-grid">
        <PayoutObligations
          state={workspace.obligations}
          onLoadMore={() => void workspace.loadMoreObligations()}
          onRetry={workspace.refresh}
        />
        <PayoutsActivity
          state={workspace.activity}
          onLoadMore={() => void workspace.loadMoreActivity()}
          onRetry={workspace.refresh}
        />
      </div>
    </main>
  );
}
