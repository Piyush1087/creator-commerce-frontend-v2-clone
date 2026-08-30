import { useEffect, useMemo, useState } from "react";

import { Alert, Button, SideDrawer, TextField } from "../../../design-system/aurora";
import {
  createBrandReturn,
  EscrowApiError,
} from "../api/brand-escrow-client";
import type { BrandReturnSummaryApiResponse } from "../contracts/escrow.contracts";
import { BRAND_RETURN_PRESENTATION } from "../utils/brand-return-presentation";
import { displayCurrency } from "../utils/display-value";
import {
  amountIsWithinAuthoritativeLimit,
  parseTreasuryAmount,
} from "../utils/treasury-money";

type BrandReturnDrawerProps = {
  open: boolean;
  summary: BrandReturnSummaryApiResponse;
  onClose: () => void;
  onRefresh: () => Promise<void>;
  onNotice: (message: string) => void;
};

function definiteErrorCopy(error: EscrowApiError): string {
  if (error.code === "PROVIDER_SETUP_REQUIRED")
    return "The return provider is unavailable. No return was completed and no destination was changed.";
  if (error.code === "INSUFFICIENT_AVAILABLE_BALANCE")
    return "Available balance changed before confirmation. Reload the authoritative Treasury state.";
  if (error.code === "SOURCE_PROVENANCE_REQUIRED")
    return "The requested amount is no longer backed by eligible original sources. Reload the returnable balance.";
  return error.message;
}

export function BrandReturnDrawer({
  open,
  summary,
  onClose,
  onRefresh,
  onNotice,
}: BrandReturnDrawerProps) {
  const [amountInput, setAmountInput] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [requestIdentity, setRequestIdentity] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [outcomeUnknown, setOutcomeUnknown] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const amount = useMemo(() => parseTreasuryAmount(amountInput), [amountInput]);
  const currencyUnavailable = summary.currency === null;

  useEffect(() => {
    if (!open) return;
    setAmountInput("");
    setConfirmed(false);
    setRequestIdentity(crypto.randomUUID());
    setSubmitting(false);
    setOutcomeUnknown(false);
    setSubmitError(null);
  }, [open]);

  const validationError = currencyUnavailable
    ? "Return currency is currently unavailable. Refresh Treasury status before requesting a return."
    : !amount
      ? "Enter an amount greater than zero with no more than two decimal places."
      : !amountIsWithinAuthoritativeLimit(
            amount,
            summary.self_service_returnable_balance,
          )
        ? "Amount exceeds the current backend-confirmed self-service returnable balance."
        : null;

  const handleSubmit = async () => {
    if (
      currencyUnavailable ||
      !amount ||
      validationError ||
      !confirmed ||
      !requestIdentity
    )
      return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const request = await createBrandReturn({
        amount: amount.majorAmount,
        idempotencyIdentity: requestIdentity,
      });
      const state = BRAND_RETURN_PRESENTATION[request.status];
      onClose();
      onNotice(`${state.label}. ${state.description}`);
      await onRefresh();
    } catch (error) {
      setSubmitting(false);
      const apiError = error instanceof EscrowApiError ? error : null;
      const unknown = apiError?.outcomeUnknown ?? false;
      setOutcomeUnknown(unknown);
      setSubmitError(
        unknown
          ? "The request outcome is unknown. Do not submit another return; refresh the request list first."
          : apiError
            ? definiteErrorCopy(apiError)
            : error instanceof Error
              ? error.message
              : "Brand Return could not be requested.",
      );
      await onRefresh();
    }
  };

  return (
    <SideDrawer
      isOpen={open}
      onClose={onClose}
      title="Return unused funds"
      subtitle="Return eligible AVAILABLE money to its original external source(s)."
      width="500px"
      footer={
        <div className="settings-drawer-footer">
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={() => void handleSubmit()}
            disabled={
              Boolean(validationError) ||
              currencyUnavailable ||
              !confirmed ||
              submitting ||
              outcomeUnknown
            }
          >
            {submitting ? "Requesting return…" : "Confirm Brand Return"}
          </Button>
        </div>
      }
    >
      <div className="settings-drawer-body">
        {currencyUnavailable ? (
          <Alert tone="warning" title="Return currency unavailable">
            Return currency is currently unavailable. Refresh Treasury status before
            requesting a return.
          </Alert>
        ) : null}
        {submitError ? (
          <Alert
            tone="error"
            title={outcomeUnknown ? "Return status is unknown" : "Return not confirmed"}
          >
            {submitError}
          </Alert>
        ) : null}
        <div className="brand-escrow-returnable">
          <span>Self-service returnable now</span>
          <strong>
            {displayCurrency(
              summary.self_service_returnable_balance,
              summary.currency,
            )}
          </strong>
        </div>
        <TextField
          label={`Return amount (${summary.currency ?? "currency unavailable"})`}
          value={amountInput}
          onChange={(event) => setAmountInput(event.target.value)}
          inputMode="decimal"
          autoComplete="off"
          placeholder="0.00"
          disabled={currencyUnavailable}
          error={amountInput ? validationError ?? undefined : undefined}
        />
        <div className="brand-escrow-explainer">
          <strong>How Brand Return works</strong>
          <p>
            The backend selects eligible original funding sources in order. One request
            may span multiple sources. There is no bank, card, payment, or source picker.
          </p>
          <p>
            Processing is asynchronous. An accepted request is not complete until the
            backend reports COMPLETED.
          </p>
        </div>
        <label className="settings-modal__confirm">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(event) => setConfirmed(event.target.checked)}
            disabled={currencyUnavailable}
          />
          <span>
            I confirm that I am returning unused eligible funds to their backend-selected
            original payment source(s).
          </span>
        </label>
      </div>
    </SideDrawer>
  );
}
