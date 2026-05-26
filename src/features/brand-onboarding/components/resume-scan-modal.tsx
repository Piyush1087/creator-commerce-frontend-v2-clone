import { X } from "lucide-react";

import { Button } from "../../../design-system/aurora";

type ResumeScanModalProps = {
  open: boolean;
  domain: string;
  onClose: () => void;
  onContinue: () => void;
};

export function ResumeScanModal({
  open,
  domain,
  onClose,
  onContinue,
}: ResumeScanModalProps) {
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
        aria-labelledby="bob-resume-scan-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="bob-funnel-page__header">
          <h2 id="bob-resume-scan-title" className="aurora-card__title">
            Resume your scan
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
          We found a recent scan for {domain}. Your results are ready to view.
        </p>
        <Button type="button" variant="primary" style={{ width: "100%" }} onClick={() => onContinue()}>
          Continue to Brand DNA
        </Button>
      </div>
    </div>
  );
}
