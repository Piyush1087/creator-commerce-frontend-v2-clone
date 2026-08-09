import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Building2,
  CircleCheck,
  Clock,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  Shield,
  Wallet,
} from "lucide-react";
import { Link } from "react-router-dom";

import { Alert, Badge, Button } from "../../../design-system/aurora";
import { SideDrawer } from "../../../design-system/aurora/components/SideDrawer";
import { AUTH_ROUTES } from "../../auth/constants";
import {
  displayCurrency,
  displayText,
  EMPTY_DISPLAY,
} from "../../brand-escrow/utils/display-value";
import type {
  CreatorClearedPayoutRow,
  CreatorEscrowPipelineRow,
  CreatorPayoutsLedgerTab,
} from "../contracts/creator-payouts.contracts";
import { useCreatorPayouts } from "../hooks/use-creator-payouts";
import {
  exportCreatorAnnualTaxFormPdf,
  exportCreatorClearedReceiptPdf,
  exportCreatorMonthlyStatementPdf,
} from "../utils/payout-document-exports";
import { CreatorBankDetailsDrawer } from "./CreatorBankDetailsDrawer";
import "../creator-payouts.css";

function formatDate(iso: string | null | undefined): string {
  if (!iso) return EMPTY_DISPLAY;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return EMPTY_DISPLAY;
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function brandInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

type DrawerSelection =
  | { kind: "escrow"; row: CreatorEscrowPipelineRow }
  | { kind: "cleared"; row: CreatorClearedPayoutRow };

export function CreatorPayoutsWorkspace() {
  const { data, loading, error, reload } = useCreatorPayouts();
  const [activeTab, setActiveTab] = useState<CreatorPayoutsLedgerTab>("escrow");
  const [bankDrawerOpen, setBankDrawerOpen] = useState(false);
  const [bankDrawerMode, setBankDrawerMode] = useState<"add" | "edit" | "fix">("add");
  const [detailSelection, setDetailSelection] = useState<DrawerSelection | null>(null);

  const summary = data?.summary;
  const currency = summary?.currency ?? "INR";
  const bank = data?.bank_method;

  const escrowCount = data?.counts.escrow_pipeline ?? 0;
  const clearedCount = data?.counts.cleared_payouts ?? 0;

  const bankCard = useMemo(() => {
    if (!data) return null;
    if (bank?.status === "suspended") {
      return (
        <div className="cp-bank-card cp-bank-card--error">
          <h2 className="cp-bank-card__title">Payout method suspended</h2>
          <p className="cp-bank-card__body">
            Your connected payout method requires attention. Identity verification failed or
            the routing details were rejected by the clearing network.
          </p>
          <Button
            variant="primary"
            onClick={() => {
              setBankDrawerMode("fix");
              setBankDrawerOpen(true);
            }}
          >
            Fix payout details
          </Button>
        </div>
      );
    }
    if (bank?.status === "verified") {
      return (
        <div className="cp-bank-card cp-bank-card--verified">
          <h2 className="cp-bank-card__title">Active payout method</h2>
          <div className="cp-bank-card__row">
            <Building2 size={20} aria-hidden />
            <span>{displayText(bank.bank_name)}</span>
            <span>Account ending in •••• {displayText(bank.account_last_4)}</span>
            <Badge tone="success">Verified</Badge>
          </div>
          <Button
            variant="ghost"
            className="cp-bank-card__edit-mobile"
            onClick={() => {
              setBankDrawerMode("edit");
              setBankDrawerOpen(true);
            }}
          >
            Edit or update bank account
          </Button>
        </div>
      );
    }
    return (
      <div className="cp-bank-card cp-bank-card--warning">
        <h2 className="cp-bank-card__title">Bank account setup required</h2>
        <p className="cp-bank-card__body">
          You currently have {displayCurrency(summary?.total_escrow_balance, currency)} secured
          in active contracts. Connect a verified bank account so funds route to you when milestones
          are approved.
        </p>
        <Button
          onClick={() => {
            setBankDrawerMode("add");
            setBankDrawerOpen(true);
          }}
        >
          Add bank details
        </Button>
      </div>
    );
  }, [bank, currency, data, summary?.total_escrow_balance]);

  return (
    <div className="cp-workspace cc-workspace">
      <header className="cp-workspace__header">
        <h1 className="cp-workspace__title">Earnings &amp; Payouts Hub</h1>
        <p className="cp-workspace__subtitle">
          Track your secured escrow milestones, monitor upcoming bank transfers, and manage your
          financial compliance documents.
        </p>
      </header>

      {error ? (
        <Alert tone="error" title="Could not load payouts">
          {error}
        </Alert>
      ) : null}

      <section className="cp-metrics" aria-label="Financial pipeline">
        <article className="cp-metric-card cp-metric-card--secure">
          <p className="cp-metric-card__label">Active escrow locks</p>
          <p className="cp-metric-card__value">
            {loading ? (
              <Loader2 size={20} className="brand-escrow-spin" aria-hidden />
            ) : (
              displayCurrency(summary?.total_escrow_balance, currency)
            )}
          </p>
          <p className="cp-metric-card__tag">
            <Shield size={14} style={{ verticalAlign: "middle", marginRight: 4 }} aria-hidden />
            Secured across {summary?.active_campaign_count ?? 0} active brief
            {(summary?.active_campaign_count ?? 0) === 1 ? "" : "s"}
          </p>
        </article>

        <article className="cp-metric-card cp-metric-card--processing">
          <p className="cp-metric-card__label">Clearing in progress</p>
          <p className="cp-metric-card__value">
            {loading ? EMPTY_DISPLAY : displayCurrency(summary?.processing_balance, currency)}
          </p>
          <p className="cp-metric-card__tag">
            <Clock size={14} style={{ verticalAlign: "middle", marginRight: 4 }} aria-hidden />
            Est. arrival: {formatDate(summary?.next_payout_date)}
          </p>
        </article>

        <article className="cp-metric-card cp-metric-card--lifetime">
          <p className="cp-metric-card__label">Lifetime earnings</p>
          <p className="cp-metric-card__value">
            {loading ? EMPTY_DISPLAY : displayCurrency(summary?.lifetime_cleared_balance, currency)}
          </p>
          <p className="cp-metric-card__tag">
            <Wallet size={14} style={{ verticalAlign: "middle", marginRight: 4 }} aria-hidden />
            Since {summary?.account_creation_year ?? EMPTY_DISPLAY}
          </p>
        </article>
      </section>

      {bankCard}

      <section className="cp-panel">
        <h2 className="cp-metric-card__label" style={{ margin: 0 }}>
          Transaction ledger
        </h2>

        <div className="cp-ledger-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            className={
              activeTab === "escrow" ? "cp-ledger-tab cp-ledger-tab--active" : "cp-ledger-tab"
            }
            onClick={() => setActiveTab("escrow")}
          >
            Active escrow pipeline ({escrowCount})
          </button>
          <button
            type="button"
            role="tab"
            className={
              activeTab === "cleared" ? "cp-ledger-tab cp-ledger-tab--active" : "cp-ledger-tab"
            }
            onClick={() => setActiveTab("cleared")}
          >
            <CircleCheck size={16} aria-hidden />
            Cleared payouts ({clearedCount})
          </button>
          <button
            type="button"
            role="tab"
            className={
              activeTab === "invoices" ? "cp-ledger-tab cp-ledger-tab--active" : "cp-ledger-tab"
            }
            onClick={() => setActiveTab("invoices")}
          >
            <FileText size={16} aria-hidden />
            Invoices &amp; taxes
          </button>
        </div>

        {activeTab === "invoices" ? (
          <>
            <p className="cc-muted" style={{ margin: 0 }}>
              Download auto-generated invoices for your accounting and annual tax withholding
              documents.
            </p>
            <div className="cp-invoice-row">
              <span>Monthly statement</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => data && exportCreatorMonthlyStatementPdf(data)}
                disabled={!data || data.cleared_payouts.length === 0}
              >
                Download PDF
              </Button>
            </div>
            <div className="cp-invoice-row">
              <span>Annual tax form (1099-NEC / Form 16A)</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  data &&
                  exportCreatorAnnualTaxFormPdf(data.summary.account_creation_year, data)
                }
                disabled={!data}
              >
                Download PDF
              </Button>
            </div>
          </>
        ) : activeTab === "escrow" ? (
          <>
            <p className="cc-muted" style={{ margin: 0 }}>
              Funds locked in platform escrow. Released automatically once deliverables are
              approved.
            </p>
            <div className="cp-table-wrap cp-table-wrap--desktop">
              <table className="cp-table">
                <thead>
                  <tr>
                    <th>Brand / campaign</th>
                    <th>Amount locked</th>
                    <th>Milestone status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.escrow_pipeline ?? []).length === 0 ? (
                    <tr>
                      <td colSpan={4} className="cc-muted">
                        {loading ? "Loading…" : "No active escrow pipeline entries."}
                      </td>
                    </tr>
                  ) : (
                    data?.escrow_pipeline.map((row) => (
                      <tr key={row.collaboration_id}>
                        <td>
                          <strong>{row.brand_name}</strong>
                          <div className="cc-muted">{row.campaign_name}</div>
                        </td>
                        <td className="cp-table__amount">
                          {displayCurrency(row.amount_locked, currency)}
                        </td>
                        <td>{displayText(row.milestone_status)}</td>
                        <td>
                          <Link
                            to={`${AUTH_ROUTES.creatorCollaborations}?collaboration=${encodeURIComponent(row.collaboration_id)}`}
                          >
                            <Button variant="outline" size="sm">
                              View workflow
                              <ExternalLink size={14} style={{ marginLeft: 6 }} aria-hidden />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="cp-mobile-list">
              {(data?.escrow_pipeline ?? []).map((row) => (
                <button
                  key={row.collaboration_id}
                  type="button"
                  className="cp-mobile-row"
                  onClick={() => setDetailSelection({ kind: "escrow", row })}
                >
                  <span className="cp-mobile-row__avatar">{brandInitials(row.brand_name)}</span>
                  <span>
                    <strong>{row.campaign_name}</strong>
                    <div className="cc-muted">{row.brand_name}</div>
                  </span>
                  <Badge tone="pending">{displayCurrency(row.amount_locked, currency)}</Badge>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <p className="cc-muted" style={{ margin: 0 }}>
              Historical ledger of funds transferred to your connected bank account.
            </p>
            <div className="cp-table-wrap cp-table-wrap--desktop">
              <table className="cp-table">
                <thead>
                  <tr>
                    <th>Date cleared</th>
                    <th>Brand / campaign</th>
                    <th>Net payout</th>
                    <th>Status</th>
                    <th>Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.cleared_payouts ?? []).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="cc-muted">
                        {loading ? "Loading…" : "No cleared payouts yet."}
                      </td>
                    </tr>
                  ) : (
                    data?.cleared_payouts.map((row) => (
                      <tr key={row.transaction_id ?? `${row.collaboration_id}-${row.cleared_at}`}>
                        <td>{formatDate(row.cleared_at)}</td>
                        <td>
                          <strong>{row.brand_name}</strong>
                          <div className="cc-muted">{row.campaign_name}</div>
                        </td>
                        <td className="cp-table__amount">
                          {displayCurrency(row.net_payout, currency)}
                        </td>
                        <td>
                          <Badge tone="success">{displayText(row.status)}</Badge>
                        </td>
                        <td>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => exportCreatorClearedReceiptPdf(row, currency)}
                          >
                            <Download size={16} aria-hidden />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="cp-mobile-list">
              {(data?.cleared_payouts ?? []).map((row) => (
                <button
                  key={row.transaction_id ?? `${row.collaboration_id}-${row.cleared_at}`}
                  type="button"
                  className="cp-mobile-row"
                  onClick={() => setDetailSelection({ kind: "cleared", row })}
                >
                  <span className="cp-mobile-row__avatar">{brandInitials(row.brand_name)}</span>
                  <span>
                    <strong>{row.campaign_name}</strong>
                    <div className="cc-muted">{row.brand_name}</div>
                  </span>
                  <Badge tone="success">{displayCurrency(row.net_payout, currency)}</Badge>
                </button>
              ))}
            </div>
          </>
        )}
      </section>

      {bank?.status === "none" && (summary?.total_escrow_balance ?? 0) > 0 ? (
        <div className="cp-bank-card cp-bank-card--warning" role="status">
          <AlertTriangle size={18} aria-hidden />
          <span className="cc-muted" style={{ marginLeft: 8 }}>
            Connect a bank account to receive payouts when milestones clear.
          </span>
        </div>
      ) : null}

      <CreatorBankDetailsDrawer
        open={bankDrawerOpen}
        mode={bankDrawerMode}
        onClose={() => setBankDrawerOpen(false)}
        onSaved={() => void reload()}
      />

      <SideDrawer
        isOpen={detailSelection !== null}
        onClose={() => setDetailSelection(null)}
        title="Transaction details"
      >
        {detailSelection?.kind === "escrow" ? (
          <>
            <p className="cp-drawer-amount">
              {displayCurrency(detailSelection.row.amount_locked, currency)}
            </p>
            <p className="cp-drawer-meta">
              {detailSelection.row.brand_name} · {detailSelection.row.campaign_name}
            </p>
            <p className="cp-drawer-meta">
              Milestone: {detailSelection.row.milestone_status}
            </p>
            <p className="cp-drawer-meta">
              Gross {displayCurrency(detailSelection.row.fee_breakdown.gross_quote, currency)} ·
              Platform fee {displayCurrency(detailSelection.row.fee_breakdown.platform_fee, currency)}
              · Net {displayCurrency(detailSelection.row.fee_breakdown.net_payout, currency)}
            </p>
            <p className="cp-drawer-meta">
              Escrow status: {displayText(detailSelection.row.escrow_status)}
            </p>
            <Link
              to={`${AUTH_ROUTES.creatorCollaborations}?collaboration=${encodeURIComponent(detailSelection.row.collaboration_id)}`}
            >
              <Button variant="primary" style={{ width: "100%" }}>
                Go to collaboration workflow
              </Button>
            </Link>
          </>
        ) : null}
        {detailSelection?.kind === "cleared" ? (
          <>
            <p className="cp-drawer-amount">
              {displayCurrency(detailSelection.row.net_payout, currency)}
            </p>
            <p className="cp-drawer-meta">
              {detailSelection.row.brand_name} · {detailSelection.row.campaign_name}
            </p>
            <p className="cp-drawer-meta">
              Gross {displayCurrency(detailSelection.row.fee_breakdown.gross_quote, currency)} ·
              Platform fee {displayCurrency(detailSelection.row.fee_breakdown.platform_fee, currency)}
            </p>
            <p className="cp-drawer-meta">
              Net settled {displayCurrency(detailSelection.row.fee_breakdown.net_payout, currency)} ·
              Status: {displayText(detailSelection.row.status)}
            </p>
            <p className="cp-drawer-meta">Cleared: {formatDate(detailSelection.row.cleared_at)}</p>
            {detailSelection.row.transaction_id ? (
              <p className="cp-drawer-meta">TXN {detailSelection.row.transaction_id}</p>
            ) : null}
          </>
        ) : null}
      </SideDrawer>
    </div>
  );
}
