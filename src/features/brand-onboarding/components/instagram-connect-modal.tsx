import { Instagram, X } from "lucide-react";

import { Button } from "../../../design-system/aurora";

type InstagramConnectModalProps = {
  open: boolean;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onContinue: () => void | Promise<void>;
};

export function InstagramConnectModal({
  open,
  busy,
  error,
  onClose,
  onContinue,
}: InstagramConnectModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="bob-modal-backdrop"
      role="presentation"
      onClick={() => {
        if (!busy) {
          onClose();
        }
      }}
    >
      <div
        className="bob-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bob-ig-connect-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="bob-modal__mobile-handle" aria-hidden />
        <div className="bob-modal__header">
          <button
            type="button"
            className="bob-modal__close"
            aria-label="Close modal"
            disabled={busy}
            onClick={() => onClose()}
          >
            <X size={20} aria-hidden />
          </button>
        </div>
        <div className="bob-modal__body">
          <h2 id="bob-ig-connect-title" className="bob-modal__title">
            Connect Instagram
          </h2>
          <p className="bob-modal__description">
            Sign in with your Instagram professional account (Business or Creator).
            We&apos;ll exchange the auth token and unlock profile insights for your brand.
          </p>
          {error ? (
            <p className="bob-inline-error" role="alert">
              {error}
            </p>
          ) : null}
          {busy ? (
            <p className="bob-otp-helper">Waiting for Instagram authorization…</p>
          ) : null}
        </div>
        <div className="bob-modal__footer">
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={() => onClose()}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={busy}
            onClick={() => void onContinue()}
          >
            <Instagram size={18} aria-hidden />
            {busy ? "Opening Instagram…" : "Continue with Instagram"}
          </Button>
        </div>
      </div>
    </div>
  );
}
