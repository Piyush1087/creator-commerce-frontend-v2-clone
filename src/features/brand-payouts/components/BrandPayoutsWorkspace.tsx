import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleCheck,
  Copy,
  ExternalLink,
  Download,
  FileText,
  History,
  Layers,
  Loader2,
  Lock,
  LockOpen,
  Network,
  PiggyBank,
  Wallet,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";

import { Alert, Badge, Button } from "../../../design-system/aurora";
import { SideDrawer } from "../../../design-system/aurora/components/SideDrawer";
import { AUTH_ROUTES } from "../../auth/constants";
import { EscrowTopUpDrawer } from "../../brand-escrow/components/escrow-top-up-drawer";
import { EscrowTransactionResultModal } from "../../brand-escrow/components/escrow-transaction-result-modal";
import { useBrandEscrow } from "../../brand-escrow/hooks/use-brand-escrow";
import type { EscrowLedgerEntry } from "../../brand-escrow/types";
import {
  displayCurrency,
  displayText,
  EMPTY_DISPLAY,
} from "../../brand-escrow/utils/display-value";
import "../../brand-escrow/brand-escrow.css";

import { downloadLedgerCsv, formatLedgerAmount } from "../utils/export-ledger-csv";
import {
  exportClearingReceiptPdf,
  exportMonthlyEscrowStatementPdf,
  exportPlatformFeeGstInvoicePdf,
  exportTdsLedgerFolder,
} from "../utils/payout-document-exports";
import { useBrandPayoutsHub } from "../hooks/use-brand-payouts-hub";
import { mapHubLedgerRow, maskSensitiveAccount } from "../utils/map-hub-ledger";
import type { BrandEscrowLockRow } from "../contracts/brand-payouts.contracts";
import {
  filterLedgerForTab,
  ledgerTabLabel,
  type PayoutsLedgerTab,
} from "../utils/ledger-tab-filter";
import "../brand-payouts.css";

const LEDGER_TABS: PayoutsLedgerTab[] = ["all", "locks", "disbursals", "invoices"];

const TYPE_SHORT: Record<string, string> = {
  VBA_TOPUP_WIRE: "Deposit",
  GATEWAY_TOPUP_CARD: "Deposit",
  CONTRACT_LOCK_RESERVE: "Lock",
  TRANCHE_ADVANCE_RELEASE: "Release",
  TRANCHE_FINAL_RELEASE: "Release",
  PLATFORM_FEE_CAPTURE: "Fee",
  TDS_BUFFER_REVERSAL: "Refund",
  FAILED_COLLAB_REFUND: "Refund",
};

function formatLedgerDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return EMPTY_DISPLAY;
  }
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function statusTone(status: string | undefined): "success" | "pending" | "error" | "neutral" {
  const normalized = status?.toUpperCase() ?? "";
  if (normalized.includes("SETTLE") || normalized.includes("SUCCESS")) {
    return "success";
  }
  if (normalized.includes("LOCK") || normalized.includes("PEND") || normalized.includes("PROCESS")) {
    return "pending";
  }
  if (normalized.includes("FAIL") || normalized.includes("ERROR")) {
    return "error";
  }
  return "neutral";
}

function ledgerContext(entry: EscrowLedgerEntry): string {
  if (entry.contextLabel) {
    return entry.contextLabel;
  }
  if (entry.collaborationId) {
    return `Collaboration ${entry.collaborationId.slice(0, 8)}…`;
  }
  return entry.label;
}

function campaignDetailPath(campaignId: string): string {
  return AUTH_ROUTES.brandUceCampaignDetail.replace(":id", encodeURIComponent(campaignId));
}

async function copyFundingDetails(lines: string[]): Promise<boolean> {
  const payload = lines.filter((line) => line && !line.endsWith(EMPTY_DISPLAY)).join("\n");
  if (!payload) {
    return false;
  }
  try {
    await navigator.clipboard.writeText(payload);
    return true;
  } catch {
    return false;
  }
}

export function BrandPayoutsWorkspace() {
  const { hub, loading: hubLoading, error: hubError, reloadHub } = useBrandPayoutsHub();
  const {
    vault,
    vaultMissing,
    errorMessage,
    initializing,
    processingPayment,
    initializeVault,
    refreshAfterPayment,
  } = useBrandEscrow();

  const isFinanceAdmin = hub?.workspace_role !== "CAMPAIGN_MANAGER";
  const ledger = useMemo(
    () => (hub?.ledger ?? []).map(mapHubLedgerRow),
    [hub?.ledger],
  );

  const [activeTab, setActiveTab] = useState<PayoutsLedgerTab>("all");
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [resultModal, setResultModal] = useState<"success" | "failed" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<EscrowLedgerEntry | null>(null);
  const [selectedLock, setSelectedLock] = useState<BrandEscrowLockRow | null>(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);

  const currency = hub?.vault?.currency ?? vault?.currency ?? null;
  const vaultActive = Boolean(hub?.vault ?? vault) && !(hub?.vault_missing ?? vaultMissing);
  const isLoading = hubLoading;
  const isBusy = initializing || processingPayment;
  const activeCampaignCount = hub?.summary.active_campaign_count ?? 0;
  const stalledCount = hub?.summary.stalled_allocations_count ?? 0;
  const funding = hub?.funding;
  const brandName = hub?.brand_corporate_name ?? "Brand";

  const filteredLedger = useMemo(
    () => filterLedgerForTab(ledger, activeTab),
    [ledger, activeTab],
  );

  const showLowBalance =
    vaultActive &&
    (hub?.vault?.available_balance ?? vault?.available_balance ?? 0) <= 0 &&
    (hub?.vault?.locked_campaign_funds ?? vault?.locked_campaign_funds ?? 0) > 0;

  const accountName = funding?.account_name
    ? funding.account_name
    : vault?.bank_name
      ? `Aura Escrow Account — ${vault.bank_name}`
      : "Aura Escrow Account";

  const fundingLines = useMemo(
    () =>
      funding
        ? [
            `Account Name: ${funding.account_name}`,
            `Corporate Account Number: ${isFinanceAdmin ? funding.corporate_account_number : maskSensitiveAccount(funding.corporate_account_number)}`,
            `Bank Routing IFSC Code: ${funding.ifsc_code}`,
            `UPI Link String: ${funding.upi_vpa}`,
            `Razorpay Virtual Account ID: ${funding.razorpay_virtual_account_id}`,
          ]
        : vault
          ? [
              `Account Name: ${accountName}`,
              `Corporate Account Number: ${displayText(vault.virtual_account_number)}`,
              `Bank Routing IFSC Code: ${displayText(vault.ifsc_code)}`,
              `UPI Link String: ${displayText(vault.upi_vpa)}`,
              `Razorpay Virtual Account ID: ${displayText(vault.razorpay_virtual_account_id)}`,
            ]
          : [],
    [accountName, funding, isFinanceAdmin, vault],
  );

  const handleInitialize = async () => {
    setActionError(null);
    try {
      await initializeVault();
      await reloadHub();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to initialize escrow vault.");
    }
  };

  const handleCopyFunding = async () => {
    const ok = await copyFundingDetails(fundingLines);
    setCopySuccess(ok);
    if (ok) {
      window.setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handlePaymentSuccess = async () => {
    setTopUpOpen(false);
    setActionError(null);
    try {
      await refreshAfterPayment();
      await reloadHub();
      setResultModal("success");
    } catch {
      setResultModal("success");
    }
  };

  const openEntryDetail = (entry: EscrowLedgerEntry) => {
    setSelectedEntry(entry);
    setSelectedLock(null);
    setDetailDrawerOpen(true);
  };

  const openLockDetail = (row: BrandEscrowLockRow) => {
    setSelectedLock(row);
    setSelectedEntry(null);
    setDetailDrawerOpen(true);
  };

  const tabIcon = (tab: PayoutsLedgerTab) => {
    switch (tab) {
      case "all":
        return <Layers size={16} aria-hidden />;
      case "locks":
        return <Lock size={16} aria-hidden />;
      case "disbursals":
        return <CircleCheck size={16} aria-hidden />;
      case "invoices":
        return <FileText size={16} aria-hidden />;
      default:
        return null;
    }
  };

  return (
    <div className="bp-workspace cc-workspace">
      <header className="bp-workspace__header">
        <h1 className="bp-workspace__title">Billing, Escrow &amp; Compliance Hub</h1>
        <p className="bp-workspace__subtitle">
          Monitor corporate liquidity reserves, track high-precision multi-tenant escrow allocations,
          access secure funding rails, and audit statutory tax deductions.
        </p>
      </header>

      {errorMessage || actionError || hubError ? (
        <Alert tone="error" title="Could not load payouts data">
          {errorMessage ?? actionError ?? hubError}
        </Alert>
      ) : null}

      {vaultMissing && hub?.vault_missing !== false && !isBusy && !isLoading ? (
        <div className="bp-init-banner">
          <p className="cc-muted" style={{ margin: 0 }}>
            Initialize your secure escrow vault to fund creator payouts, view liquidity metrics, and
            access corporate wire credentials.
          </p>
          <Button onClick={() => void handleInitialize()} disabled={initializing || !isFinanceAdmin}>
            Initialize Secure Escrow Vault
            <LockOpen size={18} style={{ marginLeft: 8 }} aria-hidden />
          </Button>
        </div>
      ) : null}

      {isBusy ? (
        <div className="bp-init-banner">
          <p className="cc-muted" style={{ margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <Loader2 size={18} className="brand-escrow-spin" aria-hidden />
            {processingPayment
              ? "Verifying your top-up with the payment gateway…"
              : "Provisioning your escrow vault and funding rails…"}
          </p>
        </div>
      ) : null}

      <div className="bp-grid">
        <div className="bp-metrics">
          <div className="bp-metrics__carousel">
            <article className="bp-metric-card">
              <div className="bp-metric-card__row">
                <div className="bp-metric-card__icon">
                  <Wallet size={22} aria-hidden />
                </div>
                <span className="bp-metric-card__badge">Real-time</span>
              </div>
              <div>
                <p className="bp-metric-card__label">Total Pooled Balance</p>
                <p className="bp-metric-card__value">
                  {isLoading ? EMPTY_DISPLAY : displayCurrency(hub?.vault?.total_pooled_balance ?? vault?.total_pooled_balance, currency)}
                </p>
                {isLoading || !vaultActive ? (
                  <p className="bp-metric-card__sync">
                    <span className="bp-metric-card__sync-dot" aria-hidden />
                    Syncing with RazorpayX node…
                  </p>
                ) : null}
              </div>
            </article>

            <article className="bp-metric-card bp-metric-card--warning">
              <div className="bp-metric-card__row">
                <div className="bp-metric-card__icon">
                  <Lock size={22} aria-hidden />
                </div>
              </div>
              <div>
                <p className="bp-metric-card__label bp-metric-card__label--alert">Active Escrow Holds</p>
                <p className="bp-metric-card__value">
                  {isLoading ? EMPTY_DISPLAY : displayCurrency(hub?.vault?.locked_campaign_funds ?? vault?.locked_campaign_funds, currency)}
                </p>
                <p className="bp-metric-card__hint">
                  Frozen liabilities for running milestones across {activeCampaignCount} live
                  campaign{activeCampaignCount === 1 ? "" : "s"}.
                </p>
              </div>
            </article>

            <article className="bp-metric-card">
              <div className="bp-metric-card__row">
                <div className="bp-metric-card__icon bp-metric-card__icon--green">
                  <PiggyBank size={22} aria-hidden />
                </div>
              </div>
              <div>
                <p className="bp-metric-card__label">Liquid Available Balance</p>
                <p className="bp-metric-card__value bp-metric-card__value--green">
                  {isLoading ? EMPTY_DISPLAY : displayCurrency(hub?.vault?.available_balance ?? vault?.available_balance, currency)}
                </p>
                <p className="bp-metric-card__hint">Immediate spendable purchasing power.</p>
              </div>
            </article>
          </div>

          {showLowBalance ? (
            <div className="bp-alert" role="status">
              <AlertTriangle size={20} color="var(--status-error)" aria-hidden />
              <div>
                <p className="bp-alert__copy">
                  Low balance: you have {stalledCount} creator lock
                  {stalledCount === 1 ? "" : "s"} stalled due to insufficient available funding
                  assets.
                </p>
                {isFinanceAdmin ? (
                  <Button
                    variant="outline"
                    size="sm"
                    style={{ marginTop: 12 }}
                    onClick={() => setTopUpOpen(true)}
                    disabled={!vaultActive}
                  >
                    Request wallet top-up from finance
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        <div className="bp-metrics" style={{ gap: "var(--space-sm)" }}>
          <section className="bp-panel">
            <div className="bp-panel__title-row">
              <h2 className="bp-panel__title">
                <Network size={18} color="var(--color-primary)" aria-hidden />
                Secure Funding Rails
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void handleCopyFunding()}
                disabled={!vaultActive}
                className="bp-funding-grid--desktop"
              >
                <Copy size={16} style={{ marginRight: 6 }} aria-hidden />
                {copySuccess ? "Details copied!" : "Copy funding node details"}
              </Button>
            </div>

            <div className="bp-funding-grid bp-funding-grid--desktop">
              <div>
                <p className="bp-funding-field__label">Account name</p>
                <p className="bp-funding-field__value">{vaultActive ? accountName : EMPTY_DISPLAY}</p>
              </div>
              <div>
                <p className="bp-funding-field__label">Corporate account number</p>
                <p className="bp-funding-field__value">
                  {isFinanceAdmin
                    ? displayText(funding?.corporate_account_number ?? vault?.virtual_account_number)
                    : maskSensitiveAccount(
                        funding?.corporate_account_number ?? vault?.virtual_account_number,
                      )}
                </p>
              </div>
              <div>
                <p className="bp-funding-field__label">Bank routing IFSC code</p>
                <p className="bp-funding-field__value">
                  {displayText(funding?.ifsc_code ?? vault?.ifsc_code)}
                </p>
              </div>
              <div>
                <p className="bp-funding-field__label">UPI link string</p>
                <p className="bp-funding-field__value">
                  {displayText(funding?.upi_vpa ?? vault?.upi_vpa)}
                </p>
              </div>
              <div>
                <p className="bp-funding-field__label">Bank partner node</p>
                <p className="bp-funding-field__value">
                  {displayText(funding?.bank_partner ?? vault?.bank_name)}
                </p>
              </div>
            </div>

            <div className="bp-funding-mobile">
              <p className="bp-funding-field__label">Primary funding node</p>
              <p className="bp-funding-field__value" style={{ marginBottom: 12 }}>
                {displayText(vault?.ifsc_code)}
              </p>
              <Button
                variant="outline"
                onClick={() => void handleCopyFunding()}
                disabled={!vaultActive}
                style={{ width: "100%" }}
              >
                <Copy size={16} style={{ marginRight: 6 }} aria-hidden />
                Copy banking wire node details
              </Button>
            </div>
          </section>

          <section className="bp-panel">
            <h2 className="bp-panel__title">
              <History size={18} color="var(--color-primary)" aria-hidden />
              Transaction history ledger
            </h2>

            <div className="bp-ledger-tabs" role="tablist" aria-label="Ledger views">
              {LEDGER_TABS.filter((tab) => (tab === "invoices" ? isFinanceAdmin : true)).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab}
                  className={
                    activeTab === tab ? "bp-ledger-tab bp-ledger-tab--active" : "bp-ledger-tab"
                  }
                  onClick={() => setActiveTab(tab)}
                >
                  {tabIcon(tab)}
                  {ledgerTabLabel(tab)}
                </button>
              ))}
            </div>

            {activeTab === "invoices" && isFinanceAdmin ? (
              <>
                <p className="bp-ledger-helper">
                  Secure accounting repository for operational expense statements and statutory TDS
                  deduction logs.
                </p>
                <div className="bp-invoice-list">
                  <div className="bp-invoice-row">
                    <span>Monthly consolidated escrow statement summary</span>
                    <div className="bp-footer__actions">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportMonthlyEscrowStatementPdf(hub?.ledger ?? [], brandName)}
                        disabled={(hub?.ledger ?? []).length === 0}
                      >
                        Export PDF
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadLedgerCsv(ledger)}
                        disabled={ledger.length === 0}
                      >
                        Export CSV
                      </Button>
                    </div>
                  </div>
                  <div className="bp-invoice-row">
                    <span>Platform service fee tax input credit invoices</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportPlatformFeeGstInvoicePdf(hub?.ledger ?? [], brandName)}
                    >
                      Download GST invoice PDF
                    </Button>
                  </div>
                  <div className="bp-invoice-row">
                    <span>Quarterly statutory withholding TDS ledger</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        exportTdsLedgerFolder(hub?.escrow_locks ?? [], hub?.ledger ?? [])
                      }
                    >
                      Access tax folder
                    </Button>
                  </div>
                </div>
              </>
            ) : activeTab === "locks" ? (
              <>
                <p className="bp-ledger-helper">
                  Short-term liabilities locked until creative execution milestones pass sign-off.
                </p>
                <div className="bp-table-wrap">
                  <table className="bp-table">
                    <thead>
                      <tr>
                        <th>Lock code</th>
                        <th>Creator</th>
                        <th>Campaign</th>
                        <th>Gross quote</th>
                        <th className="bp-table__mobile-hide">7% platform fee</th>
                        <th className="bp-table__mobile-hide">18% GST</th>
                        <th className="bp-table__mobile-hide">2% TDS buffer</th>
                        <th>Total hold</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(hub?.escrow_locks ?? []).length === 0 ? (
                        <tr>
                          <td colSpan={9} className="cc-muted">
                            {isLoading ? "Loading ledger…" : "No active escrow locks."}
                          </td>
                        </tr>
                      ) : (
                        hub?.escrow_locks.map((row) => (
                          <LockTableRow
                            key={row.lock_id}
                            row={row}
                            currency={currency}
                            isFinanceAdmin={isFinanceAdmin}
                            onOpenDetail={() => openLockDetail(row)}
                          />
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            ) : activeTab === "disbursals" ? (
              <>
                <p className="bp-ledger-helper">
                  Complete settling actions disbursed to creator accounts via advance tranches or
                  performance clearings.
                </p>
                <div className="bp-table-wrap">
                  <table className="bp-table">
                    <thead>
                      <tr>
                        <th>Disbursal ID</th>
                        <th>Creator payee</th>
                        <th>Tranche</th>
                        <th>Net settled</th>
                        <th className="bp-table__mobile-hide">RazorpayX ref</th>
                        <th>Receipt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(hub?.disbursals ?? []).length === 0 ? (
                        <tr>
                          <td colSpan={6} className="cc-muted">
                            {isLoading ? "Loading ledger…" : "No cleared disbursals yet."}
                          </td>
                        </tr>
                      ) : (
                        hub?.disbursals.map((row) => (
                          <tr key={row.disbursal_id}>
                            <td className="cc-muted">{row.disbursal_id.slice(0, 10)}…</td>
                            <td>{displayText(row.recipient_creator)}</td>
                            <td>{displayText(row.tranche_phase)}</td>
                            <td className="bp-table__amount">
                              {displayCurrency(row.net_settled_amount, currency)}
                            </td>
                            <td className="bp-table__mobile-hide cc-muted">
                              {displayText(row.razorpay_clearing_reference)}
                            </td>
                            <td>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => exportClearingReceiptPdf(row, brandName)}
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
              </>
            ) : (
              <>
                <p className="bp-ledger-helper">
                  Chronological tracking of incoming top-ups, outgoing disbursals, asset holds,
                  and platform adjustments.
                </p>

                <div className="bp-table-wrap">
                  <table className="bp-table">
                    <thead>
                      <tr>
                        <th>Date / time</th>
                        <th className="bp-table__mobile-hide">TXN hash</th>
                        <th className="bp-table__mobile-hide">Type</th>
                        <th>Creator / campaign</th>
                        <th className="bp-table__amount">Amount</th>
                        <th className="bp-table__status">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLedger.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="cc-muted">
                            {isLoading ? "Loading ledger…" : "No transactions in this view."}
                          </td>
                        </tr>
                      ) : (
                        filteredLedger.map((entry) => (
                          <tr
                            key={entry.id}
                            onClick={() => openEntryDetail(entry)}
                            style={{ cursor: "pointer" }}
                          >
                            <td>{formatLedgerDate(entry.occurredAt)}</td>
                            <td className="bp-table__mobile-hide cc-muted">{entry.id}</td>
                            <td className="bp-table__mobile-hide">
                              <Badge tone="neutral">
                                {TYPE_SHORT[entry.transactionType] ?? entry.transactionType}
                              </Badge>
                            </td>
                            <td>{ledgerContext(entry)}</td>
                            <td className="bp-table__amount">{formatLedgerAmount(entry)}</td>
                            <td className="bp-table__status">
                              <Badge tone={statusTone(entry.status)}>
                                {displayText(entry.status)}
                              </Badge>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>
        </div>
      </div>

      <footer className="bp-footer bp-footer--desktop">
        <Button variant="ghost" size="sm" onClick={() => setActiveTab("all")}>
          <History size={16} style={{ marginRight: 6 }} aria-hidden />
          Clear ledger filter scopes
        </Button>
        <div className="bp-footer__actions">
          <Button
            variant="outline"
            onClick={() => downloadLedgerCsv(filteredLedger)}
            disabled={filteredLedger.length === 0 || activeTab === "invoices"}
          >
            <Download size={16} style={{ marginRight: 6 }} aria-hidden />
            Export filtered view to CSV
          </Button>
          <Button onClick={() => setTopUpOpen(true)} disabled={!vaultActive || isBusy || !isFinanceAdmin}>
            <Zap size={16} style={{ marginRight: 6 }} aria-hidden />
            Authorize fast top-up request
          </Button>
        </div>
      </footer>

      <footer className="bp-footer bp-footer--mobile">
        <Button
          onClick={() => setTopUpOpen(true)}
          disabled={!vaultActive || isBusy}
          style={{ width: "100%" }}
        >
          Request corporate balance top-up
        </Button>
      </footer>

      <EscrowTopUpDrawer
        open={topUpOpen}
        vault={hub?.vault ?? vault}
        onClose={() => setTopUpOpen(false)}
        onPaymentSuccess={() => void handlePaymentSuccess()}
        onPaymentFailed={(message) => {
          setTopUpOpen(false);
          setActionError(message);
          setResultModal("failed");
        }}
      />

      {resultModal ? (
        <EscrowTransactionResultModal
          variant={resultModal}
          onClose={() => setResultModal(null)}
        />
      ) : null}

      <SideDrawer
        isOpen={detailDrawerOpen}
        onClose={() => setDetailDrawerOpen(false)}
        title="Transaction details"
        subtitle={
          selectedEntry
            ? ledgerContext(selectedEntry)
            : selectedLock
              ? `${selectedLock.creator_handle} / ${selectedLock.campaign_name}`
              : undefined
        }
      >
        {selectedEntry ? (
          <>
            <p className="bp-mobile-drawer__amount">{formatLedgerAmount(selectedEntry)}</p>
            <p className="bp-mobile-drawer__meta">
              {formatLedgerDate(selectedEntry.occurredAt)} · {selectedEntry.label}
            </p>
            <p className="bp-mobile-drawer__meta">
              TXN {selectedEntry.id}
              {selectedEntry.gatewayReferenceId
                ? ` · Ref ${selectedEntry.gatewayReferenceId}`
                : ""}
            </p>
            <div className="bp-mobile-drawer__actions">
              {selectedEntry.collaborationId ? (
                <Link
                  to={`${AUTH_ROUTES.brandCollaborations}?collaboration=${encodeURIComponent(selectedEntry.collaborationId)}`}
                >
                  <Button variant="primary" style={{ width: "100%" }}>
                    Go to collaboration
                    <CheckCircle2 size={16} style={{ marginLeft: 8 }} aria-hidden />
                  </Button>
                </Link>
              ) : null}
            </div>
          </>
        ) : null}
        {selectedLock ? (
          <>
            <p className="bp-mobile-drawer__amount">
              {displayCurrency(selectedLock.total_hold_value, currency)}
            </p>
            <p className="bp-mobile-drawer__meta">
              Gross {displayCurrency(selectedLock.gross_base_quote, currency)} · Platform fee{" "}
              {displayCurrency(selectedLock.platform_commission, currency)} · TDS buffer{" "}
              {displayCurrency(selectedLock.tds_buffer_pool, currency)}
            </p>
            <div className="bp-mobile-drawer__actions">
              <Link to={campaignDetailPath(selectedLock.campaign_id)}>
                <Button variant="primary" style={{ width: "100%" }}>
                  Go to campaign layout
                  <ExternalLink size={16} style={{ marginLeft: 8 }} aria-hidden />
                </Button>
              </Link>
              {isFinanceAdmin ? (
                <Link
                  to={`${AUTH_ROUTES.brandCollaborations}?collaboration=${encodeURIComponent(selectedLock.collaboration_id)}`}
                >
                  <Button variant="outline" style={{ width: "100%" }}>
                    Milestone phase override release
                  </Button>
                </Link>
              ) : null}
              <Button variant="outline" onClick={() => setDetailDrawerOpen(false)}>
                View full financial details
              </Button>
            </div>
          </>
        ) : null}
      </SideDrawer>
    </div>
  );
}

type LockTableRowProps = {
  row: BrandEscrowLockRow;
  currency: string | null;
  isFinanceAdmin: boolean;
  onOpenDetail: () => void;
};

function LockTableRow({ row, currency, isFinanceAdmin, onOpenDetail }: LockTableRowProps) {
  return (
    <tr onClick={onOpenDetail} style={{ cursor: "pointer" }}>
      <td className="cc-muted">{row.lock_id.slice(0, 10)}…</td>
      <td>{row.creator_handle}</td>
      <td>{row.campaign_name}</td>
      <td className="bp-table__amount">{displayCurrency(row.gross_base_quote, currency)}</td>
      <td className="bp-table__mobile-hide">
        {displayCurrency(row.platform_commission, currency)}
      </td>
      <td className="bp-table__mobile-hide">
        {displayCurrency(row.platform_commission_gst, currency)}
      </td>
      <td className="bp-table__mobile-hide">
        {displayCurrency(row.tds_buffer_pool, currency)}
      </td>
      <td className="bp-table__amount">{displayCurrency(row.total_hold_value, currency)}</td>
      <td onClick={(event) => event.stopPropagation()}>
        {isFinanceAdmin ? (
          <Link
            to={`${AUTH_ROUTES.brandCollaborations}?collaboration=${encodeURIComponent(row.collaboration_id)}`}
          >
            <Button variant="outline" size="sm">
              Override release
            </Button>
          </Link>
        ) : (
          <Button variant="outline" size="sm" onClick={onOpenDetail}>
            View lock
          </Button>
        )}
      </td>
    </tr>
  );
}
