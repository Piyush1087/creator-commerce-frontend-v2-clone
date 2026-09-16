import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import type { PropsWithChildren, ReactNode, RefObject } from "react";
import { X } from "lucide-react";

type SideDrawerProps = PropsWithChildren<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  footer?: ReactNode;
  width?: string;
  closeLabel?: string;
  initialFocusRef?: RefObject<HTMLElement>;
  restoreFocusRef?: RefObject<HTMLElement>;
  className?: string;
  contentClassName?: string;
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
  initialFocusRef,
  restoreFocusRef,
  className,
  contentClassName,
}: SideDrawerProps) {
  const titleId = useId();
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;
    const requestedRestoreTarget = restoreFocusRef?.current;
    const background = Array.from(document.body.children)
      .filter(
        (element): element is HTMLElement =>
          element instanceof HTMLElement &&
          element !== drawerRef.current?.parentElement,
      )
      .map((element) => ({ element, inert: element.inert }));
    background.forEach(({ element }) => {
      element.inert = true;
    });
    document.body.style.overflow = "hidden";
    const focusFrame = window.requestAnimationFrame(() => {
      (initialFocusRef?.current ?? closeButtonRef.current)?.focus();
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
      background.forEach(({ element, inert }) => {
        element.inert = inert;
      });
      const restoreTarget = requestedRestoreTarget ?? previousFocus;
      if (restoreTarget instanceof HTMLElement && restoreTarget.isConnected)
        restoreTarget.focus({ preventScroll: true });
    };
  }, [isOpen, initialFocusRef, restoreFocusRef]);

  if (!isOpen) return null;

  return createPortal(
    <div className="aurora-sidedrawer-overlay" onClick={onClose}>
      <div
        ref={drawerRef}
        className={`aurora-sidedrawer${className ? ` ${className}` : ""}`}
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

        <div
          className={`aurora-sidedrawer__content${contentClassName ? ` ${contentClassName}` : ""}`}
          tabIndex={0}
        >
          {children}
        </div>

        {footer && (
          <footer className="aurora-sidedrawer__footer">{footer}</footer>
        )}
      </div>
    </div>,
    document.body,
  );
}
