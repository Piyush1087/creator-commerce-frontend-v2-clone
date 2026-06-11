import { ArrowRight, CheckCircle2, X, XCircle } from "lucide-react";

import { Button } from "../../../design-system/aurora";

type EscrowTransactionResultModalProps = {
  variant: "success" | "failed";
  onClose: () => void;
};

export function EscrowTransactionResultModal({
  variant,
  onClose,
}: EscrowTransactionResultModalProps) {
  const isSuccess = variant === "success";

  return (
    <div
      className="brand-escrow-result-backdrop"
      role="dialog"
      aria-modal
      aria-labelledby="escrow-result-title"
    >
      <div className={`brand-escrow-result brand-escrow-result--${variant}`}>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute",
            top: "1rem",
            right: "1rem",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: "var(--text-muted)",
          }}
        >
          <X size={20} />
        </button>

        {isSuccess ? (
          <CheckCircle2 size={56} color="#006c4b" aria-hidden />
        ) : (
          <XCircle size={56} color="var(--status-error)" aria-hidden />
        )}

        <h2 id="escrow-result-title" className="brand-escrow-result__title">
          {isSuccess ? "Escrow Top-Up Cleared" : "Transaction Failed"}
        </h2>
        <p
          style={{
            margin: "0 0 1.5rem",
            fontFamily: "var(--font-body)",
            fontSize: "var(--size-body)",
            color: "var(--text-muted)",
          }}
        >
          {isSuccess
            ? "Your corporate escrow vault has been credited. Ledger synchronization is complete."
            : "The payment gateway declined this transaction. No funds were moved from your vault."}
        </p>

        {isSuccess ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
              marginBottom: "1.5rem",
              textAlign: "left",
            }}
          >
            {[
              "Digital Ledger Synchronization Complete",
              "Compliance Audit Trail Generated",
            ].map((line) => (
              <div
                key={line}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  color: "#006c4b",
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--size-caption)",
                }}
              >
                <CheckCircle2 size={16} aria-hidden />
                {line}
              </div>
            ))}
          </div>
        ) : null}

        <Button onClick={onClose} fullWidthOnMobile>
          Return to Billing Workspace
          <ArrowRight size={16} style={{ marginLeft: 8 }} aria-hidden />
        </Button>
      </div>
    </div>
  );
}
