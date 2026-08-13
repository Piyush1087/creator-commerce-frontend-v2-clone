import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

import { Button } from "../../../design-system/aurora";
import { mountGoogleIdButton } from "../utils/google-id-token";

type GoogleVerifyModalProps = {
  open: boolean;
  brandDomain: string;
  onClose: () => void;
  onIdToken: (idToken: string) => void | Promise<void>;
};

export function GoogleVerifyModal({
  open,
  brandDomain,
  onClose,
  onIdToken,
}: GoogleVerifyModalProps) {
  const buttonHostRef = useRef<HTMLDivElement | null>(null);
  const [mountError, setMountError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;
    let cleanup: (() => void) | undefined;
    setMountError(null);

    const mount = async () => {
      const host = buttonHostRef.current;
      if (!host) {
        return;
      }
      try {
        cleanup = await mountGoogleIdButton({
          container: host,
          onCredential: (idToken) => {
            if (cancelled) {
              return;
            }
            setIsSubmitting(true);
            void Promise.resolve(onIdToken(idToken)).finally(() => {
              if (!cancelled) {
                setIsSubmitting(false);
              }
            });
          },
          onError: (error) => {
            if (!cancelled) {
              setMountError(error.message);
            }
          },
        });
      } catch (error) {
        if (!cancelled) {
          setMountError(
            error instanceof Error
              ? error.message
              : "Google Sign-In could not start.",
          );
        }
      }
    };

    void mount();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [open, onIdToken]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="bob-modal-backdrop"
      role="presentation"
      onClick={() => {
        if (!isSubmitting) {
          onClose();
        }
      }}
    >
      <div
        className="bob-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bob-google-verify-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="bob-modal__mobile-handle" aria-hidden />
        <div className="bob-modal__header">
          <button
            type="button"
            className="bob-modal__close"
            aria-label="Close modal"
            disabled={isSubmitting}
            onClick={() => onClose()}
          >
            <X size={20} aria-hidden />
          </button>
        </div>
        <div className="bob-modal__body">
          <h2 id="bob-google-verify-title" className="bob-modal__title">
            Verify with Google
          </h2>
          <p className="bob-modal__description">
            Continue with a Google Workspace account for{" "}
            <strong>@{brandDomain}</strong>. If the account domain does not match
            your brand website, signup will be rejected.
          </p>
          <div
            ref={buttonHostRef}
            className="bob-google-verify-button-host"
            aria-busy={isSubmitting}
          />
          {mountError ? (
            <p className="bob-inline-error" role="alert">
              {mountError}
            </p>
          ) : null}
          {isSubmitting ? (
            <p className="bob-otp-helper">Confirming Google identity…</p>
          ) : null}
        </div>
        <div className="bob-modal__footer">
          <Button
            type="button"
            variant="ghost"
            disabled={isSubmitting}
            onClick={() => onClose()}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
