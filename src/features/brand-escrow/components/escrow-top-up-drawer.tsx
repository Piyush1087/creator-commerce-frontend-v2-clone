import { Bolt, Lock, Shield, X } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "../../../design-system/aurora";
import { createEscrowTopUpIntent } from "../api/brand-escrow-client";
import type { EscrowVaultApiResponse } from "../contracts/escrow.contracts";
import type { EscrowTopUpMethod } from "../types";
import { computeTopUpBreakdown } from "../utils/compute-topup-breakdown";
import { currencyInputPrefix } from "../utils/currency-input-prefix";
import { displayCurrency, displayText } from "../utils/display-value";
import { formatEscrowCurrency } from "../utils/format-escrow-currency";
import { openRazorpayCheckout } from "../utils/razorpay-checkout";

type EscrowTopUpDrawerProps = {
  open: boolean;
  vault: EscrowVaultApiResponse | null;
  onClose: () => void;
  onPaymentSuccess: () => void;
  onPaymentFailed: (message: string) => void;
};

function parseAmountInput(raw: string): number {
  const normalized = raw.replace(/,/g, "").trim();
  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function EscrowTopUpDrawer({
  open,
  vault,
  onClose,
  onPaymentSuccess,
  onPaymentFailed,
}: EscrowTopUpDrawerProps) {
  const [amountInput, setAmountInput] = useState("");
  const [method, setMethod] = useState<EscrowTopUpMethod>("card");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const currency = vault?.currency ?? "INR";
  const allocation = useMemo(() => parseAmountInput(amountInput), [amountInput]);
  const breakdown = useMemo(
    () => computeTopUpBreakdown(allocation, currency),
    [allocation, currency],
  );

  if (!open) {
    return null;
  }

  const handleProceed = async () => {
    setSubmitError(null);

    if (method === "bank_wire") {
      onClose();
      return;
    }

    if (!vault || allocation <= 0) {
      setSubmitError("Enter a valid amount to top up.");
      return;
    }

    setSubmitting(true);
    try {
      const intent = await createEscrowTopUpIntent({
        targetAllocation: allocation,
        idempotencyKey: crypto.randomUUID(),
      });

      await openRazorpayCheckout({
        orderId: intent.checkout_order_id,
        description: `Escrow top-up ${formatEscrowCurrency(intent.allocation_amount, currency)}`,
        onSuccess: () => {
          setSubmitting(false);
          onPaymentSuccess();
        },
        onDismiss: () => {
          setSubmitting(false);
          onPaymentFailed("Payment was cancelled or closed before completion.");
        },
      });
    } catch (error) {
      setSubmitting(false);
      const message =
        error instanceof Error ? error.message : "Failed to start card payment.";
      setSubmitError(message);
      onPaymentFailed(message);
    }
  };

  return (
    <>
      <button
        type="button"
        className="brand-escrow-drawer-backdrop"
        aria-label="Close top up drawer"
        onClick={onClose}
      />
      <aside className="brand-escrow-drawer" aria-label="Top up escrow balance">
        <div className="brand-escrow-drawer__header">
          <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
            <h2 className="brand-escrow-drawer__title">Top Up Escrow Balance</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              style={{
                border: "none",
                background: "transparent",
                cursor: "pointer",
                color: "var(--text-muted)",
              }}
            >
              <X size={20} />
            </button>
          </div>
          <p className="brand-escrow-drawer__subtitle">
            Inject liquidity to your secure corporate escrow vault to fund upcoming
            creator campaign workflows.
          </p>
        </div>

        <div className="brand-escrow-drawer__body">
          <div>
            <label
              htmlFor="escrow-topup-amount"
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontFamily: "var(--font-heading)",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Enter Amount to Allocate
            </label>
            <div className="brand-escrow-amount-input">
              <span className="brand-escrow-amount-input__symbol" aria-hidden>
                {currencyInputPrefix(currency)}
              </span>
              <input
                id="escrow-topup-amount"
                className="brand-escrow-amount-input__field"
                value={amountInput}
                onChange={(event) => setAmountInput(event.target.value)}
                placeholder="0.00"
                inputMode="decimal"
                autoComplete="off"
                aria-label={`Amount to allocate in ${currency}`}
              />
            </div>
          </div>

          <div>
            <h3
              style={{
                margin: "0 0 1rem",
                fontFamily: "var(--font-heading)",
                fontSize: "var(--size-body)",
                fontWeight: 700,
              }}
            >
              Select Ingestion Method
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <button
                type="button"
                className={`brand-escrow-method ${method === "bank_wire" ? "brand-escrow-method--active" : ""}`}
                onClick={() => setMethod("bank_wire")}
              >
                <div className="brand-escrow-method__row">
                  <span
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontSize: "var(--size-body)",
                      fontWeight: 700,
                    }}
                  >
                    Bank Wire (NEFT / RTGS / IMPS)
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "var(--size-caption)",
                      color: "#006c4b",
                      background: "color-mix(in srgb, var(--color-primary) 12%, transparent)",
                      padding: "0.125rem 0.5rem",
                      borderRadius: "var(--radius-pill)",
                    }}
                  >
                    Fee 0.00%
                  </span>
                </div>
                <div
                  style={{
                    marginTop: "0.75rem",
                    padding: "1rem",
                    borderRadius: "var(--radius-input)",
                    border: "1px solid var(--border-default)",
                    background: "var(--surface-card)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                    textAlign: "left",
                  }}
                >
                  {[
                    ["Beneficiary", displayText(null)],
                    ["VAN", displayText(vault?.virtual_account_number)],
                    ["IFSC", displayText(vault?.ifsc_code)],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "1rem",
                        fontFamily: "var(--font-body)",
                        fontSize: "var(--size-caption)",
                      }}
                    >
                      <span style={{ color: "var(--text-muted)" }}>{label}</span>
                      <span style={{ fontWeight: 700 }}>{value}</span>
                    </div>
                  ))}
                </div>
              </button>

              <button
                type="button"
                className={`brand-escrow-method ${method === "card" ? "brand-escrow-method--active" : ""}`}
                onClick={() => setMethod("card")}
              >
                <div className="brand-escrow-method__row">
                  <span
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontSize: "var(--size-body)",
                      fontWeight: 700,
                      color: method === "card" ? "#006c4b" : "var(--text-high)",
                    }}
                  >
                    Instant Deposit (Corporate Credit Card)
                  </span>
                  <Bolt size={20} color="#006c4b" fill="#006c4b" aria-hidden />
                </div>
                <div className="brand-escrow-breakdown" style={{ marginTop: "1rem" }}>
                  <div className="brand-escrow-breakdown__row">
                    <span>Target Escrow Allocation Setup</span>
                    <span>
                      {breakdown
                        ? formatEscrowCurrency(breakdown.allocation, currency)
                        : displayCurrency(null, currency)}
                    </span>
                  </div>
                  <div className="brand-escrow-breakdown__row">
                    <span>Gateway Processing Surcharge (2.00%)</span>
                    <span>
                      {breakdown
                        ? formatEscrowCurrency(breakdown.gatewaySurcharge, currency)
                        : displayCurrency(null, currency)}
                    </span>
                  </div>
                  <div className="brand-escrow-breakdown__row">
                    <span>Surcharge Statutory GST (18.00% on Fee)</span>
                    <span>
                      {breakdown
                        ? formatEscrowCurrency(breakdown.surchargeGst, currency)
                        : displayCurrency(null, currency)}
                    </span>
                  </div>
                  <div className="brand-escrow-breakdown__total">
                    <span>Total Invoiced Gateway Charge Amount</span>
                    <span>
                      {breakdown
                        ? formatEscrowCurrency(breakdown.totalInvoiced, currency)
                        : displayCurrency(null, currency)}
                    </span>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {submitError ? (
            <p
              role="alert"
              style={{
                margin: 0,
                fontFamily: "var(--font-body)",
                fontSize: "var(--size-caption)",
                color: "var(--status-error)",
              }}
            >
              {submitError}
            </p>
          ) : null}

          <div className="brand-escrow-trust">
            <Shield size={18} aria-hidden />
            <p style={{ margin: 0 }}>
              Your transaction is encrypted and secured by bank-grade protocols. Funds
              are held in a regulated escrow account.
            </p>
          </div>
        </div>

        <div className="brand-escrow-drawer__footer">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            style={{
              border: "none",
              background: "transparent",
              fontFamily: "var(--font-heading)",
              fontSize: "var(--size-body)",
              fontWeight: 700,
              color: "var(--text-muted)",
              cursor: "pointer",
            }}
          >
            Cancel and Close
          </button>
          <Button
            onClick={() => void handleProceed()}
            disabled={submitting || (method === "card" && allocation <= 0)}
            fullWidthOnMobile
          >
            {method === "bank_wire"
              ? "Close — transfer using bank details above"
              : submitting
                ? "Opening payment gateway…"
                : "Proceed to Secure Payment Gateway"}
            {method === "card" ? (
              <Lock size={16} style={{ marginLeft: 8 }} aria-hidden />
            ) : null}
          </Button>
        </div>
      </aside>
    </>
  );
}
