import { useEffect, useMemo, useState } from "react";

import { Alert, Button, SideDrawer, TextField } from "../../../design-system/aurora";
import {
  createEscrowTopUpIntent,
  EscrowApiError,
} from "../api/brand-escrow-client";
import type { EscrowVaultApiResponse } from "../contracts/escrow.contracts";
import { formatEscrowCurrency } from "../utils/format-escrow-currency";
import { openRazorpayCheckout } from "../utils/razorpay-checkout";
import {
  meetsIndiaTopUpMinimum,
  parseTreasuryAmount,
} from "../utils/treasury-money";

type EscrowTopUpDrawerProps = {
  open: boolean;
  vault: EscrowVaultApiResponse | null;
  onClose: () => void;
  onRefresh?: () => Promise<void>;
  onNotice?: (message: string) => void;
};

export function EscrowTopUpDrawer({
  open,
  vault,
  onClose,
  onRefresh,
  onNotice,
}: EscrowTopUpDrawerProps) {
  const [amountInput, setAmountInput] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [outcomeUnknown, setOutcomeUnknown] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const amount = useMemo(() => parseTreasuryAmount(amountInput), [amountInput]);

  useEffect(() => {
    if (!open) return;
    setAmountInput("");
    setIdempotencyKey(crypto.randomUUID());
    setSubmitting(false);
    setOutcomeUnknown(false);
    setSubmitError(null);
  }, [open]);

  if (!vault) return null;

  const refresh = onRefresh ?? (async () => undefined);
  const notify = onNotice ?? (() => undefined);

  const validationError = !amount
    ? "Enter an amount greater than zero with no more than two decimal places."
    : !meetsIndiaTopUpMinimum(amount, vault.currency)
      ? "The minimum INR top-up is ₹5,000."
      : null;

  const settleHandoff = async (message: string) => {
    setSubmitting(false);
    onClose();
    notify(message);
    await refresh();
  };

  const handleProceed = async () => {
    setSubmitError(null);
    if (!amount || validationError || !idempotencyKey) return;
    setSubmitting(true);
    try {
      const intent = await createEscrowTopUpIntent({
        targetAllocation: amount.majorAmount,
        idempotencyKey,
      });
      try {
        await openRazorpayCheckout({
          orderId: intent.checkout_order_id,
          description: `Treasury funding ${formatEscrowCurrency(
            intent.allocation_amount,
            vault.currency,
          )}`,
          onSuccess: () => {
            void settleHandoff(
              "Payment was submitted. Available balance will change only after backend confirmation; review Pending funding and refresh status.",
            );
          },
          onDismiss: () => {
            void settleHandoff(
              "Checkout closed. No funds were credited optimistically; the funding load may remain pending.",
            );
          },
        });
      } catch (error) {
        setSubmitting(false);
        setOutcomeUnknown(true);
        setSubmitError(
          `${error instanceof Error ? error.message : "Provider handoff is unavailable."} The funding intent may already exist; refresh Treasury status instead of retrying this attempt.`,
        );
        await refresh();
      }
    } catch (error) {
      setSubmitting(false);
      const unknown = error instanceof EscrowApiError && error.outcomeUnknown;
      setOutcomeUnknown(unknown);
      setSubmitError(
        unknown
          ? "The initiation outcome is unknown. Refresh Treasury status before starting another top-up."
          : error instanceof Error
            ? error.message
            : "Top-up initiation failed.",
      );
      if (unknown) await refresh();
    }
  };

  return (
    <SideDrawer
      isOpen={open}
      onClose={onClose}
      title="Add funds"
      subtitle="Create a provider checkout for this pooled Brand vault."
      width="480px"
      footer={
        <div className="settings-drawer-footer">
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={() => void handleProceed()}
            disabled={Boolean(validationError) || submitting || outcomeUnknown}
          >
            {submitting ? "Opening checkout…" : "Continue to provider"}
          </Button>
        </div>
      }
    >
      <div className="settings-drawer-body">
        {submitError ? (
          <Alert tone="error" title={outcomeUnknown ? "Status must be refreshed" : "Top-up unavailable"}>
            {submitError}
          </Alert>
        ) : null}
        <TextField
          label={`Amount (${vault.currency})`}
          value={amountInput}
          onChange={(event) => setAmountInput(event.target.value)}
          inputMode="decimal"
          autoComplete="off"
          placeholder="0.00"
          error={amountInput ? validationError ?? undefined : undefined}
        />
        <div className="brand-escrow-explainer">
          <strong>Backend-confirmed funding only</strong>
          <p>
            Checkout success does not credit the vault. Funding remains unavailable while
            pending and becomes usable only after authoritative provider confirmation.
          </p>
          {vault.currency === "INR" ? (
            <p>India minimum top-up: ₹5,000.</p>
          ) : null}
        </div>
      </div>
    </SideDrawer>
  );
}
