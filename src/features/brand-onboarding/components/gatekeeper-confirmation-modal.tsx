import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Check, Clock3, ShieldCheck, X } from "lucide-react";

import { Button } from "../../../design-system/aurora";
import {
  SUPPORTED_GATEKEEPER_INDUSTRIES,
  SUPPORTED_GATEKEEPER_INDUSTRY_LABELS,
  type SupportedGatekeeperIndustry,
} from "../contracts/gatekeeper.contracts";
import "./gatekeeper-confirmation-adjustments.css";

export const COMING_SOON_INDUSTRIES = [
  { value: "REAL_ESTATE", label: "Real Estate" },
  { value: "EDUCATION", label: "Education" },
  { value: "MEDIA_ENTERTAINMENT", label: "Media & Entertainment" },
  { value: "B2B_AGENCY", label: "B2B / Agency" },
] as const;

type Props = {
  open: boolean;
  domain: string;
  detectedIndustry: SupportedGatekeeperIndustry;
  selectedIndustry: string;
  isStarting: boolean;
  error?: string | null;
  onSelectIndustry: (industry: string) => void;
  onResetIndustry: () => void;
  onConfirmSupported: () => void | Promise<void>;
  onConfirmUnsupported: () => void | Promise<void>;
  onClose: () => void;
};

const FOCUSABLE =
  'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function GatekeeperConfirmationModal({
  open,
  domain,
  detectedIndustry,
  selectedIndustry,
  isStarting,
  error,
  onSelectIndustry,
  onResetIndustry,
  onConfirmSupported,
  onConfirmUnsupported,
  onClose,
}: Props) {
  const [editingIndustry, setEditingIndustry] = useState(false);
  const dialogRef = useRef<HTMLElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setEditingIndustry(false);
    previousFocusRef.current = document.activeElement as HTMLElement | null;

    const frame = window.requestAnimationFrame(() => {
      const first = dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? dialogRef.current)?.focus();
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (!dialogRef.current) return;
      if (event.key === "Escape" && !isStarting) {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      );
      if (!focusable.length) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [isStarting, onClose, open]);

  if (!open) return null;

  const selectedSupported = SUPPORTED_GATEKEEPER_INDUSTRIES.includes(
    selectedIndustry as SupportedGatekeeperIndustry,
  );
  const isOverride = selectedSupported && selectedIndustry !== detectedIndustry;
  const isUnsupported = !selectedSupported;
  const selectedLabel = selectedSupported
    ? SUPPORTED_GATEKEEPER_INDUSTRY_LABELS[
        selectedIndustry as SupportedGatekeeperIndustry
      ]
    : COMING_SOON_INDUSTRIES.find((item) => item.value === selectedIndustry)?.label ??
      selectedIndustry;
  const detectedLabel = SUPPORTED_GATEKEEPER_INDUSTRY_LABELS[detectedIndustry];

  const keepDetectedIndustry = () => {
    onResetIndustry();
    setEditingIndustry(false);
  };

  return (
    <div className="gk-modal-backdrop" role="presentation">
      <section
        ref={dialogRef}
        className="gk-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gk-confirm-title"
        aria-describedby="gk-confirm-description"
        tabIndex={-1}
      >
        <button
          type="button"
          className="gk-icon-button"
          aria-label="Close confirmation"
          onClick={onClose}
          disabled={isStarting}
        >
          <X size={20} aria-hidden />
        </button>

        <div className="gk-modal__eyebrow">
          <ShieldCheck size={18} aria-hidden /> Ready for Brand Intelligence
        </div>
        <h2 id="gk-confirm-title">Review what we detected</h2>
        <p id="gk-confirm-description" className="gk-modal__lead">
          We’re ready to take a deeper look at <strong>{domain}</strong>. Confirm the
          top-level Industry before the scan starts.
        </p>

        <div className="gk-industry-card">
          <div className="gk-industry-current">
            <div>
              <span className="gk-label">AI-assessed Industry</span>
              <strong>{detectedLabel}</strong>
            </div>
            {!editingIndustry ? (
              <button
                type="button"
                className="gk-change-industry"
                onClick={() => setEditingIndustry(true)}
                disabled={isStarting}
              >
                Change
              </button>
            ) : null}
          </div>

          {editingIndustry ? (
            <div className="gk-industry-editor">
              <div
                className="gk-industry-options"
                role="group"
                aria-label="Supported Industries"
              >
                {SUPPORTED_GATEKEEPER_INDUSTRIES.map((industry) => (
                  <button
                    key={industry}
                    type="button"
                    className={
                      selectedIndustry === industry
                        ? "gk-industry-option gk-industry-option--selected"
                        : "gk-industry-option"
                    }
                    onClick={() => onSelectIndustry(industry)}
                    disabled={isStarting}
                    aria-pressed={selectedIndustry === industry}
                  >
                    {selectedIndustry === industry ? <Check size={15} aria-hidden /> : null}
                    {SUPPORTED_GATEKEEPER_INDUSTRY_LABELS[industry]}
                  </button>
                ))}
              </div>
              <div className="gk-coming-soon">
                <span className="gk-label">Coming soon</span>
                <div
                  className="gk-industry-options"
                  role="group"
                  aria-label="Coming soon Industries"
                >
                  {COMING_SOON_INDUSTRIES.map((industry) => (
                    <button
                      key={industry.value}
                      type="button"
                      className={
                        selectedIndustry === industry.value
                          ? "gk-industry-option gk-industry-option--coming gk-industry-option--selected"
                          : "gk-industry-option gk-industry-option--coming"
                      }
                      onClick={() => onSelectIndustry(industry.value)}
                      disabled={isStarting}
                      aria-pressed={selectedIndustry === industry.value}
                    >
                      {industry.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {isOverride ? (
          <div className="gk-warning" role="alert">
            <AlertTriangle size={20} aria-hidden />
            <div>
              <strong>You selected {selectedLabel}</strong>
              <p>
                Creator Shop detected {detectedLabel}. Keep the detected Industry, or
                explicitly continue with {selectedLabel}. Your correction will be
                recorded for operational review and will not block this scan.
              </p>
              <button type="button" onClick={keepDetectedIndustry} disabled={isStarting}>
                Keep {detectedLabel}
              </button>
            </div>
          </div>
        ) : null}

        {isUnsupported ? (
          <div className="gk-warning gk-warning--strong" role="alert">
            <AlertTriangle size={20} aria-hidden />
            <div>
              <strong>{selectedLabel} is coming soon</strong>
              <p>
                This Industry is not supported for MVP automated onboarding. If you
                confirm it, Brand Intelligence will not start.
              </p>
              <button type="button" onClick={keepDetectedIndustry} disabled={isStarting}>
                Keep {detectedLabel}
              </button>
            </div>
          </div>
        ) : null}

        <div className="gk-scan-summary">
          <div>
            <Clock3 size={18} aria-hidden />
            <span>
              <strong>Deeper brand analysis</strong>
              <small>Timing varies by site; we’ll keep you informed as the scan runs.</small>
            </span>
          </div>
          <div>
            <ShieldCheck size={18} aria-hidden />
            <span>
              <strong>No extra access required now</strong>
              <small>
                A domain-linked work email and Meta / Instagram access may be useful
                later, but are not required to start.
              </small>
            </span>
          </div>
          <div>
            <Check size={18} aria-hidden />
            <span>
              <strong>You stay in control</strong>
              <small>
                You’ll review the resulting Intelligence before it becomes part of
                your working brand context.
              </small>
            </span>
          </div>
        </div>

        {error ? <p className="gk-form-error" role="alert">{error}</p> : null}

        <div className="gk-modal__actions">
          {isUnsupported ? (
            <Button
              type="button"
              variant="primary"
              disabled={isStarting}
              onClick={() => void onConfirmUnsupported()}
            >
              {isStarting ? "Confirming…" : `Confirm ${selectedLabel}`}
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              disabled={isStarting}
              onClick={() => void onConfirmSupported()}
            >
              {isStarting
                ? "Starting…"
                : isOverride
                  ? `Continue with ${selectedLabel}`
                  : "Start Brand Intelligence Scan"}
            </Button>
          )}
          <Button type="button" variant="secondary" disabled={isStarting} onClick={onClose}>
            Cancel
          </Button>
        </div>
      </section>
    </div>
  );
}
