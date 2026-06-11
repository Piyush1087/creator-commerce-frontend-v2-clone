import { Clock, X } from "lucide-react";

import { Button } from "../../../design-system/aurora";

import { RATE_LIMIT_USER_MESSAGE } from "../api/http-api-error";

type RateLimitModalProps = {
  open: boolean;
  message?: string;
  onClose: () => void;
};

export function RateLimitModal({
  open,
  message,
  onClose,
}: RateLimitModalProps) {
  if (!open) {
    return null;
  }

  const copy = message?.trim() || RATE_LIMIT_USER_MESSAGE;

  return (
    <div
      className="bob-modal-backdrop"
      role="presentation"
      onClick={() => onClose()}
    >
      <div
        className="bob-small-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bob-rate-limit-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="bob-funnel-page__header">
          <h2 id="bob-rate-limit-title" className="aurora-card__title">
            Too many requests right now
          </h2>
          <button
            type="button"
            className="bob-icon-button"
            aria-label="Close dialog"
            onClick={() => onClose()}
          >
            <X size={18} aria-hidden />
          </button>
        </div>
        <p
          style={{
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
            marginBottom: 16,
            color: "var(--text-high)",
          }}
        >
          <Clock
            size={20}
            aria-hidden
            style={{ flexShrink: 0, marginTop: 2, color: "var(--color-primary)" }}
          />
          <span>{copy}</span>
        </p>
        <Button type="button" variant="primary" onClick={() => onClose()}>
          Got it
        </Button>
      </div>
    </div>
  );
}
