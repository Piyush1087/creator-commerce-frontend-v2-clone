import {
  CheckCircle2,
  Loader2,
  LockOpen,
  ShieldCheck,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "../../../design-system/aurora";
import { useBrandEscrow } from "../hooks/use-brand-escrow";
import { EMPTY_DISPLAY } from "../utils/display-value";
import { EscrowBalanceMetrics } from "./escrow-balance-metrics";
import { EscrowLedgerPanel } from "./escrow-ledger-panel";
import { EscrowTopUpDrawer } from "./escrow-top-up-drawer";
import { EscrowTransactionResultModal } from "./escrow-transaction-result-modal";
import { EscrowVbaPanel } from "./escrow-vba-panel";
import "../brand-escrow.css";

type EscrowAccountCardProps = {
  showLedgerInline?: boolean;
};

export function EscrowAccountCard({ showLedgerInline = false }: EscrowAccountCardProps) {
  const {
    status,
    vault,
    vaultMissing,
    ledger,
    errorMessage,
    initializing,
    processingPayment,
    initializeVault,
    refreshAfterPayment,
  } = useBrandEscrow();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [ledgerOpen, setLedgerOpen] = useState(showLedgerInline);
  const [resultModal, setResultModal] = useState<"success" | "failed" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const vaultActive = Boolean(vault) && !vaultMissing;
  const isProvisioning = initializing;
  const isProcessing = processingPayment;
  const isZeroBalance =
    vaultActive &&
    (vault?.available_balance ?? 0) === 0 &&
    (vault?.total_pooled_balance ?? 0) === 0;

  const accordionTitle = useMemo(() => {
    if (isZeroBalance) {
      return "Your Dedicated Virtual Bank Account Details (For Corporate B2B Transfers)";
    }
    return "Virtual Account Transfer Credentials (NEFT / RTGS / IMPS)";
  }, [isZeroBalance]);

  const handleInitialize = async () => {
    setActionError(null);
    try {
      await initializeVault();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to initialize escrow vault.";
      setActionError(message);
    }
  };

  const handlePaymentSuccess = async () => {
    setDrawerOpen(false);
    setActionError(null);
    try {
      await refreshAfterPayment();
      setResultModal("success");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Payment succeeded but refresh failed.";
      setActionError(message);
      setResultModal("success");
    }
  };

  const handlePaymentFailed = (message: string) => {
    setDrawerOpen(false);
    setActionError(message);
    setResultModal("failed");
  };

  const showNotInitialized = status !== "loading" && vaultMissing && !isProvisioning;
  const showActiveVault = vaultActive && !isProvisioning && !isProcessing;
  const showBusyState = isProvisioning || isProcessing;

  return (
    <>
      <section
        className={`brand-escrow-card ${showBusyState ? "brand-escrow-card--muted" : ""}`}
      >
        <div className="brand-escrow-card__glow" aria-hidden />

        <div className="brand-escrow-card__header">
          <div className="brand-escrow-card__intro">
            <div className="brand-escrow-card__icon">
              <ShieldCheck size={32} fill="currentColor" aria-hidden />
            </div>
            <div style={{ minWidth: 0 }}>
              <h2 className="brand-escrow-card__title">Secure Escrow Account</h2>
              <p className="brand-escrow-card__desc">
                Automate creator payouts securely using our high-trust multi-tenant
                architecture.
              </p>
            </div>
          </div>

          {status === "loading" ? (
            <span className="brand-escrow-status brand-escrow-status--provisioning">
              <Loader2 size={16} className="brand-escrow-spin" aria-hidden />
              Loading
            </span>
          ) : null}

          {showActiveVault ? (
            <span className="brand-escrow-status brand-escrow-status--active">
              <span aria-hidden>✅</span> Active
            </span>
          ) : null}

          {showBusyState ? (
            <span className="brand-escrow-status brand-escrow-status--provisioning">
              <span aria-hidden>⏳</span>{" "}
              {isProcessing ? "Processing" : "Provisioning in progress"}
            </span>
          ) : null}
        </div>

        {errorMessage || actionError ? (
          <div
            className="brand-escrow-callout"
            role="alert"
            style={{ borderColor: "var(--status-error)" }}
          >
            {errorMessage ?? actionError}
          </div>
        ) : null}

        {showNotInitialized ? (
          <>
            <div className="brand-escrow-callout">
              To initiate collaborations, launch campaigns, and process automated milestone
              payouts, you must first initialize your workspace escrow vault. The Creator
              Shop uses a secured virtual routing infrastructure to lock funds safely during
              content production and disburse payouts directly to verified creators upon
              automated live-post compliance checks.
            </div>
            <div className="brand-escrow-setup-row">
              <p className="brand-escrow-setup-note">
                <CheckCircle2 size={16} color="#006c4b" aria-hidden />
                Setting up this system creates a dedicated, RBI-compliant corporate banking
                node. No registration or platform infrastructure setup fees apply.
              </p>
              <Button onClick={() => void handleInitialize()} disabled={initializing}>
                Initialize Secure Escrow Vault
                <LockOpen size={18} style={{ marginLeft: 8 }} aria-hidden />
              </Button>
            </div>
          </>
        ) : null}

        {showBusyState ? (
          <>
            <div className="brand-escrow-callout">
              {isProcessing
                ? "Your corporate card payment is being verified with our banking partner. Available balance will update once the gateway confirms settlement."
                : "We are currently setting up your dedicated corporate banking nodes and automated micro-ledger architecture via our processing partner Razorpay."}
              <div className="brand-escrow-progress" aria-hidden>
                <div className="brand-escrow-progress__bar" />
              </div>
            </div>
            <div className="brand-escrow-setup-row">
              <p className="brand-escrow-setup-note">
                <CheckCircle2 size={16} color="#006c4b" aria-hidden />
                This validation typically takes between 2 to 10 minutes. Campaign execution
                paths remain locked until verification concludes.
              </p>
              <div className="brand-escrow-verifying">
                <Loader2 size={20} className="brand-escrow-spin" aria-hidden />
                System Verification...
              </div>
            </div>
          </>
        ) : null}

        {(showActiveVault || status === "loading") && !showNotInitialized ? (
          <>
            <EscrowBalanceMetrics vault={vault} />
            <EscrowVbaPanel
              vault={vault}
              defaultExpanded={isZeroBalance}
              accordionTitle={accordionTitle}
            />
            <div className="brand-escrow-footer">
              {!showLedgerInline ? (
                <button
                  type="button"
                  className="brand-escrow-footer__link"
                  onClick={() => setLedgerOpen((value) => !value)}
                >
                  {ledgerOpen ? "Hide Financial Ledger" : "View Financial Ledger"}
                </button>
              ) : (
                <span style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>
                  {ledger.length > 0
                    ? `${ledger.length} ledger entries`
                    : `Ledger: ${EMPTY_DISPLAY}`}
                </span>
              )}
              <Button
                onClick={() => setDrawerOpen(true)}
                disabled={!vaultActive || status === "loading"}
                style={{ background: "#006c4b", color: "#fff" }}
              >
                Top Up Balance
              </Button>
            </div>
            {ledgerOpen || showLedgerInline ? (
              <div style={{ marginTop: "var(--space-md)" }}>
                <EscrowLedgerPanel entries={ledger} />
              </div>
            ) : null}
          </>
        ) : null}
      </section>

      <EscrowTopUpDrawer
        open={drawerOpen}
        vault={vault}
        onClose={() => setDrawerOpen(false)}
        onPaymentSuccess={() => void handlePaymentSuccess()}
        onPaymentFailed={handlePaymentFailed}
      />

      {resultModal ? (
        <EscrowTransactionResultModal
          variant={resultModal}
          onClose={() => setResultModal(null)}
        />
      ) : null}
    </>
  );
}
