import { Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import { useState } from "react";

import { Alert, Badge, Button } from "../../../design-system/aurora";
import { canMutateTreasury } from "../contracts/escrow.contracts";
import { useBrandEscrow } from "../hooks/use-brand-escrow";
import { displayCurrency } from "../utils/display-value";
import { BrandReturnDrawer } from "./brand-return-drawer";
import { BrandReturnHistory } from "./brand-return-history";
import { EscrowBalanceMetrics } from "./escrow-balance-metrics";
import { EscrowLedgerPanel } from "./escrow-ledger-panel";
import { EscrowTopUpDrawer } from "./escrow-top-up-drawer";
import "../brand-escrow.css";

type EscrowAccountCardProps = { showLedgerInline?: boolean };

export function EscrowAccountCard({
  showLedgerInline = false,
}: EscrowAccountCardProps) {
  const {
    status,
    vault,
    returnSummary,
    returnRequests,
    ledger,
    role,
    errorMessage,
    refreshing,
    reload,
  } = useBrandEscrow();
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [ledgerOpen, setLedgerOpen] = useState(showLedgerInline);
  const [notice, setNotice] = useState<string | null>(null);
  const mutable = canMutateTreasury(role);

  if (status === "loading" && !vault) {
    return (
      <section className="brand-escrow-card brand-escrow-card--loading" aria-busy="true">
        <Loader2 size={28} className="brand-escrow-spin" aria-hidden />
        <p>Loading authoritative Treasury state…</p>
      </section>
    );
  }

  if (!vault) {
    return (
      <section className="brand-escrow-card">
        <Alert tone="error" title="Secure escrow unavailable">
          {errorMessage ?? "Treasury state could not be validated."}
        </Alert>
        <Button variant="outline" onClick={() => void reload(true)}>
          Reload Treasury
        </Button>
      </section>
    );
  }

  return (
    <>
      <section className="brand-escrow-card">
        <header className="brand-escrow-card__header">
          <div className="brand-escrow-card__intro">
            <div className="brand-escrow-card__icon" aria-hidden>
              <ShieldCheck size={28} />
            </div>
            <div>
              <h2 className="brand-escrow-card__title">Secure escrow</h2>
              <p className="brand-escrow-card__desc">
                Backend-authoritative pooled vault balances, funding, and external Brand
                Returns.
              </p>
            </div>
          </div>
          <div className="brand-escrow-card__header-actions">
            <Badge tone="success">Active vault</Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void reload(true)}
              disabled={refreshing}
            >
              <RefreshCw size={15} aria-hidden />
              {refreshing ? "Refreshing…" : "Refresh status"}
            </Button>
          </div>
        </header>

        {errorMessage ? (
          <Alert tone="error" title="Treasury refresh incomplete">
            {errorMessage} Existing values have not been changed optimistically.
          </Alert>
        ) : null}
        {notice ? (
          <div className="brand-escrow-notice" role="status">
            {notice}
          </div>
        ) : null}

        <EscrowBalanceMetrics vault={vault} />

        <div className="brand-escrow-protection-grid">
          <div className="brand-escrow-explainer">
            <strong>Protected commitments</strong>
            <p>
              Locked campaign funds and active return commitments cannot be released from
              Settings. Collaboration and backend financial resolution remain authoritative.
            </p>
          </div>
          <div className="brand-escrow-explainer">
            <strong>Creator payouts stay operational</strong>
            <p>
              Settings does not approve entitlement, release creator funds, reverse payouts,
              or expose a provider dashboard.
            </p>
          </div>
        </div>

        <div className="brand-escrow-actions" aria-label="Treasury actions">
          <div>
            <strong>Add funds</strong>
            <p>
              Provider checkout creates a pending funding load. Available balance changes
              only after backend confirmation.
            </p>
          </div>
          {mutable ? (
            <Button onClick={() => setTopUpOpen(true)}>Add funds</Button>
          ) : null}
        </div>

        {returnSummary ? (
          <div className="brand-escrow-return-panel">
            <div className="brand-escrow-return-panel__heading">
              <div>
                <strong>Return unused funds</strong>
                <p>
                  Eligible AVAILABLE money is returned to backend-selected original payment
                  source(s). No destination or source selection is accepted.
                </p>
              </div>
              {mutable ? (
                <Button
                  variant="outline"
                  onClick={() => setReturnOpen(true)}
                  disabled={
                    returnSummary.currency === null ||
                    returnSummary.self_service_returnable_balance <= 0
                  }
                >
                  Return unused funds
                </Button>
              ) : null}
            </div>
            <dl className="brand-escrow-return-summary">
              <div>
                <dt>Available</dt>
                <dd>
                  {displayCurrency(
                    returnSummary.available_balance,
                    returnSummary.currency,
                  )}
                </dd>
              </div>
              <div>
                <dt>Self-service returnable</dt>
                <dd>
                  {displayCurrency(
                    returnSummary.self_service_returnable_balance,
                    returnSummary.currency,
                  )}
                </dd>
              </div>
              <div>
                <dt>Source reconciliation required</dt>
                <dd>
                  {displayCurrency(
                    returnSummary.source_reconciliation_required_amount,
                    returnSummary.currency,
                  )}
                </dd>
              </div>
            </dl>
            {returnSummary.currency === null ? (
              <p className="brand-escrow-return-panel__guidance">
                Return currency is currently unavailable. Refresh Treasury status before
                requesting a return.
              </p>
            ) : null}
            {returnSummary.source_reconciliation_required_amount > 0 ? (
              <p className="brand-escrow-return-panel__guidance">
                Some AVAILABLE money lacks eligible source evidence for self-service return.
                It remains visible and is not treated as lost or automatically returnable.
              </p>
            ) : null}
          </div>
        ) : null}

        {!mutable ? (
          <Alert tone="warning" title="Campaign Manager read-only access">
            You can review Treasury state and Brand Return lifecycle. Brand Owner or Finance
            Admin authority is required to add or return funds.
          </Alert>
        ) : null}

        <BrandReturnHistory requests={returnRequests} />

        <div className="brand-escrow-ledger-toggle">
          {!showLedgerInline ? (
            <Button variant="ghost" onClick={() => setLedgerOpen((open) => !open)}>
              {ledgerOpen ? "Hide financial ledger" : "View financial ledger"}
            </Button>
          ) : null}
        </div>
        {ledgerOpen ? <EscrowLedgerPanel entries={ledger} /> : null}
      </section>

      <EscrowTopUpDrawer
        open={topUpOpen}
        vault={vault}
        onClose={() => setTopUpOpen(false)}
        onRefresh={() => reload(true)}
        onNotice={setNotice}
      />
      {returnSummary ? (
        <BrandReturnDrawer
          open={returnOpen}
          summary={returnSummary}
          onClose={() => setReturnOpen(false)}
          onRefresh={() => reload(true)}
          onNotice={setNotice}
        />
      ) : null}
    </>
  );
}
