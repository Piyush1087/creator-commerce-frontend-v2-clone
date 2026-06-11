import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";

import { Button } from "../../../design-system/aurora";
import { AUTH_ROUTES } from "../../auth/constants";

type BrandActiveModalProps = {
  open: boolean;
  domain: string;
  message: string;
  onClose: () => void;
};

export function BrandActiveModal({
  open,
  domain,
  message,
  onClose,
}: BrandActiveModalProps) {
  const navigate = useNavigate();

  if (!open) {
    return null;
  }

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
        aria-labelledby="bob-brand-active-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="bob-funnel-page__header">
          <h2 id="bob-brand-active-title" className="aurora-card__title">
            This brand is already active
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
        <p className="bob-muted" style={{ marginBottom: 16 }}>
          {message}
        </p>
        <p style={{ marginBottom: 16, fontWeight: 600 }}>
          Domain: <span style={{ fontFamily: "ui-monospace, monospace" }}>{domain}</span>
        </p>
        <Button
          type="button"
          variant="primary"
          style={{ width: "100%" }}
          onClick={() => {
            onClose();
            navigate(AUTH_ROUTES.login);
          }}
        >
          Sign in
        </Button>
      </div>
    </div>
  );
}
