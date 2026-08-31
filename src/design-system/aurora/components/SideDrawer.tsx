import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import type { PropsWithChildren, ReactNode } from "react";
import { X } from "lucide-react";

type SideDrawerProps = PropsWithChildren<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  footer?: ReactNode;
  width?: string;
  closeLabel?: string;
}>;

export function SideDrawer({
  children,
  isOpen,
  onClose,
  title,
  subtitle,
  footer,
  width = "600px",
  closeLabel,
}: SideDrawerProps) {
  const titleId = useId();
  const drawerRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;
    document.body.style.overflow = "hidden";
    const focusFrame = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = drawerRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;
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
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="aurora-sidedrawer-overlay" onClick={onClose}>
      <aside
        ref={drawerRef}
        className="aurora-sidedrawer"
        style={{ width }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="aurora-sidedrawer__header">
          <div className="aurora-sidedrawer__header-content">
            <h2 id={titleId} className="aurora-sidedrawer__title">
              {title}
            </h2>
            {subtitle && (
              <p className="aurora-sidedrawer__subtitle">{subtitle}</p>
            )}
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            aria-label={closeLabel ?? `Close ${title}`}
            className="aurora-sidedrawer__close"
            onClick={onClose}
          >
            <X size={24} />
          </button>
        </header>

        <main className="aurora-sidedrawer__content">{children}</main>

        {footer && (
          <footer className="aurora-sidedrawer__footer">{footer}</footer>
        )}
      </aside>
    </div>,
    document.body,
  );
}
