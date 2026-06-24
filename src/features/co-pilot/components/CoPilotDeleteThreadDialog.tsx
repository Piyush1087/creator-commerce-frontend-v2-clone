import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Trash2, X } from "lucide-react";

import { Button, Card } from "../../../design-system/aurora";

type Props = {
  open: boolean;
  threadTitle: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function CoPilotDeleteThreadDialog({
  open,
  threadTitle,
  busy,
  onConfirm,
  onCancel,
}: Props) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) {
        onCancel();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [busy, onCancel, open]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div
      className="co-pilot-dialog-backdrop"
      role="presentation"
      onClick={() => {
        if (!busy) {
          onCancel();
        }
      }}
    >
      <div
        className="co-pilot-dialog__panel"
        role="dialog"
        aria-modal="true"
        aria-label="Delete conversation"
        onClick={(event) => event.stopPropagation()}
      >
        <Card
          compact
          className="co-pilot-dialog"
          title="Delete conversation?"
          action={
            <button
              type="button"
              className="co-pilot-dialog__close"
              aria-label="Close dialog"
              disabled={busy}
              onClick={onCancel}
            >
              <X size={18} aria-hidden />
            </button>
          }
        >
          <div className="co-pilot-dialog__icon-wrap" aria-hidden>
            <Trash2 size={20} />
          </div>
          <p className="co-pilot-dialog__body">
            <strong>{threadTitle}</strong> will be archived and removed from your thread
            list. Messages stay in the system for audit purposes, but you will not see this
            conversation here again.
          </p>
          <div className="co-pilot-dialog__actions">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              autoFocus
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={busy}
              onClick={onConfirm}
            >
              {busy ? "Deleting…" : "Delete conversation"}
            </Button>
          </div>
        </Card>
      </div>
    </div>,
    document.body,
  );
}
