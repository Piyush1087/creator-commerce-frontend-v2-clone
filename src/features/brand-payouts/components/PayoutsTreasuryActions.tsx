import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { Alert, Button } from "../../../design-system/aurora";
import {
  fetchBrandReturnSummary,
  fetchEscrowVault,
} from "../../brand-escrow/api/brand-escrow-client";
import { BrandReturnDrawer } from "../../brand-escrow/components/brand-return-drawer";
import { EscrowTopUpDrawer } from "../../brand-escrow/components/escrow-top-up-drawer";
import type {
  BrandReturnSummaryApiResponse,
  EscrowVaultApiResponse,
} from "../../brand-escrow/contracts/escrow.contracts";
import "../../brand-escrow/brand-escrow.css";
import { AUTH_ROUTES } from "../../auth/constants";
import {
  resolveBrandFinancialCommandSurface,
  type BrandPayoutsOverviewResponse,
} from "../contracts/brand-payouts.contracts";
import type { PayoutsResourceState } from "../hooks/use-brand-payouts-workspace";

type PayoutsTreasuryActionsProps = {
  readonly state: PayoutsResourceState<BrandPayoutsOverviewResponse>;
  readonly onRefresh: () => void;
};

export function PayoutsTreasuryActions({
  state,
  onRefresh,
}: PayoutsTreasuryActionsProps) {
  const [vault, setVault] = useState<EscrowVaultApiResponse | null>(null);
  const [returnSummary, setReturnSummary] =
    useState<BrandReturnSummaryApiResponse | null>(null);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [loadingAction, setLoadingAction] = useState<
    "ADD_FUNDS" | "BRAND_RETURN" | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const response = state.data;
  const section = response?.sections[0];
  const surface = response
    ? resolveBrandFinancialCommandSurface(response)
    : "UNAVAILABLE";
  const currentActions =
    response && section
      ? section.available_actions.filter(
          (action) => action.authorized_as_of === response.as_of,
        )
      : [];
  const actionable =
    state.status === "READY" &&
    section?.freshness === "CURRENT" &&
    response?.viewer.projection_scope === "FULL_FINANCIAL" &&
    surface === "PAYOUTS";
  const canAddFunds = currentActions.some(
    (action) => action.action === "ADD_FUNDS",
  );
  const canRequestReturn = currentActions.some(
    (action) => action.action === "REQUEST_BRAND_RETURN",
  );

  useEffect(() => {
    if (actionable) return;
    setTopUpOpen(false);
    setReturnOpen(false);
  }, [actionable]);

  const openAddFunds = async () => {
    if (!actionable || !canAddFunds || loadingAction !== null) return;
    setError(null);
    setLoadingAction("ADD_FUNDS");
    try {
      setVault(await fetchEscrowVault());
      setTopUpOpen(true);
    } catch {
      setError(
        "Add funds is temporarily unavailable because the current vault state could not be verified.",
      );
    } finally {
      setLoadingAction(null);
    }
  };

  const openBrandReturn = async () => {
    if (!actionable || !canRequestReturn || loadingAction !== null) return;
    setError(null);
    setLoadingAction("BRAND_RETURN");
    try {
      setReturnSummary(await fetchBrandReturnSummary());
      setReturnOpen(true);
    } catch {
      setError(
        "Brand Return is temporarily unavailable because returnable funds could not be verified.",
      );
    } finally {
      setLoadingAction(null);
    }
  };

  const refreshCanonicalViews = async () => {
    onRefresh();
    const refreshes: Promise<void>[] = [];
    if (vault) {
      refreshes.push(fetchEscrowVault().then(setVault));
    }
    if (returnSummary) {
      refreshes.push(fetchBrandReturnSummary().then(setReturnSummary));
    }
    await Promise.all(refreshes);
  };

  if (response?.viewer.role === "CAMPAIGN_MANAGER") {
    return (
      <aside
        className="bp-read-only-note"
        aria-label="Payouts command availability"
      >
        <div>
          <strong>Operational read-only access</strong>
          <p>
            Brand Owner or Finance Admin authority is required to add or return
            pooled funds.
          </p>
        </div>
      </aside>
    );
  }

  if (!response && state.status === "INITIAL_LOADING") {
    return (
      <aside
        className="bp-read-only-note"
        aria-label="Payouts command availability"
      >
        <div>
          <strong>Verifying financial authority</strong>
          <p>
            Add funds and Brand Return remain unavailable while Payouts loads.
          </p>
        </div>
      </aside>
    );
  }

  if (surface === "SETTINGS") {
    const canOpenSettings =
      state.status === "READY" &&
      section?.coverage === "COMPLETE" &&
      section.freshness === "CURRENT";
    return (
      <aside
        className="bp-read-only-note"
        aria-label="Payouts command availability"
      >
        <div>
          <strong>Secure escrow Settings is active</strong>
          <p>
            Add funds and Brand Return remain in Settings until the atomic
            operational-surface cutover is enabled.
          </p>
        </div>
        {canOpenSettings ? (
          <Link className="bp-detail-link" to={AUTH_ROUTES.brandSettingsEscrow}>
            Open Secure escrow Settings
          </Link>
        ) : null}
      </aside>
    );
  }

  if (!actionable) {
    return (
      <aside
        className="bp-read-only-note"
        aria-label="Payouts command availability"
      >
        <div>
          <strong>Financial commands unavailable</strong>
          <p>
            Refresh Payouts before starting Add funds or Brand Return. No
            financial request has been submitted.
          </p>
        </div>
      </aside>
    );
  }

  return (
    <>
      <aside
        className="bp-read-only-note"
        aria-label="Payouts financial commands"
      >
        <div>
          <strong>Vault operations</strong>
          <p>
            Add funds to this pooled Brand vault or return eligible unused funds
            to their original funding sources.
          </p>
        </div>
        <div className="bp-command-actions">
          {canAddFunds ? (
            <Button
              onClick={() => void openAddFunds()}
              disabled={loadingAction === "BRAND_RETURN"}
              aria-disabled={loadingAction === "ADD_FUNDS" ? true : undefined}
            >
              {loadingAction === "ADD_FUNDS" ? "Verifying…" : "Add funds"}
            </Button>
          ) : null}
          {canRequestReturn ? (
            <Button
              variant="outline"
              onClick={() => void openBrandReturn()}
              disabled={loadingAction === "ADD_FUNDS"}
              aria-disabled={
                loadingAction === "BRAND_RETURN" ? true : undefined
              }
            >
              {loadingAction === "BRAND_RETURN"
                ? "Verifying…"
                : "Return unused funds"}
            </Button>
          ) : null}
        </div>
      </aside>
      {error ? (
        <Alert tone="error" title="Financial command unavailable">
          {error}
        </Alert>
      ) : null}
      {notice ? (
        <Alert tone="success" title="Financial request updated">
          {notice}
        </Alert>
      ) : null}
      <EscrowTopUpDrawer
        open={topUpOpen}
        vault={vault}
        commandSurface="PAYOUTS"
        onClose={() => setTopUpOpen(false)}
        onRefresh={refreshCanonicalViews}
        onNotice={setNotice}
      />
      {returnSummary ? (
        <BrandReturnDrawer
          open={returnOpen}
          summary={returnSummary}
          commandSurface="PAYOUTS"
          onClose={() => setReturnOpen(false)}
          onRefresh={refreshCanonicalViews}
          onNotice={setNotice}
        />
      ) : null}
    </>
  );
}
