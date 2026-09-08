import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { Alert } from "../../../design-system/aurora";
import { EscrowAccountCard } from "../../../features/brand-escrow/components/escrow-account-card";
import { fetchBrandPayoutsOverview } from "../../../features/brand-payouts/api/brand-payouts-client";
import {
  resolveBrandFinancialCommandSurface,
  type BrandFinancialCommandSurface,
} from "../../../features/brand-payouts/contracts/brand-payouts.contracts";
import { SettingsSectionCard } from "../../../features/settings/components/settings-section-card";
import { AUTH_ROUTES } from "../../../features/auth/constants";

export function BrandSettingsEscrowPage() {
  const [surface, setSurface] = useState<
    BrandFinancialCommandSurface | "LOADING"
  >("LOADING");

  useEffect(() => {
    const controller = new AbortController();
    void fetchBrandPayoutsOverview(controller.signal)
      .then((response) => {
        setSurface(resolveBrandFinancialCommandSurface(response));
      })
      .catch(() => {
        if (!controller.signal.aborted) setSurface("UNAVAILABLE");
      });
    return () => controller.abort();
  }, []);

  if (surface === "SETTINGS") return <EscrowAccountCard showLedgerInline />;

  if (surface === "LOADING") {
    return (
      <SettingsSectionCard
        title="Secure escrow"
        description="Verifying the active Brand financial workspace."
      >
        <p role="status">Loading financial workspace…</p>
      </SettingsSectionCard>
    );
  }

  if (surface === "UNAVAILABLE") {
    return (
      <Alert tone="error" title="Financial workspace unavailable">
        The active mutation surface could not be verified. No Add funds or Brand
        Return command is available from Settings.
      </Alert>
    );
  }

  return (
    <div className="settings-page-stack">
      <SettingsSectionCard
        title="Secure escrow"
        description="Pooled Brand funds remain protected by the same vault and financial ledger. Operational commands now live in Payouts."
        action={
          <Link
            to={AUTH_ROUTES.brandPayouts}
            className="settings-team__action-link"
          >
            Open Payouts
          </Link>
        }
      >
        <p>
          Use Payouts to add funds, review funding state, request Brand Return,
          and inspect financial activity. This Settings route remains available
          as a compatibility entry.
        </p>
      </SettingsSectionCard>
    </div>
  );
}
