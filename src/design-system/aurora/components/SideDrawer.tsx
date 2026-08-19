import { useEffect } from "react";
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
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="aurora-sidedrawer-overlay" onClick={onClose}>
      <aside
        className="aurora-sidedrawer"
        style={{ width }}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="aurora-sidedrawer__header">
          <div className="aurora-sidedrawer__header-content">
            <h2 className="aurora-sidedrawer__title">{title}</h2>
            {subtitle && (
              <p className="aurora-sidedrawer__subtitle">{subtitle}</p>
            )}
          </div>
          <button
            aria-label={closeLabel}
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
