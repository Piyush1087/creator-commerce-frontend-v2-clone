import { useEffect, useState, type PropsWithChildren } from "react";
import { AppHeader } from "./AppHeader";
import { AppSidebar } from "./AppSidebar";
import { MobileBottomNav } from "./MobileBottomNav";
import { MobileNavigation } from "./MobileNavigation";
import { MobileShellNav } from "./MobileShellNav";
import type { AppShellMainVariant } from "./sidebar-items";
import "./app-shell.css";

type AppShellProps = PropsWithChildren<{
  mainVariant?: AppShellMainVariant;
}>;

export function AppShell({ children, mainVariant = "default" }: AppShellProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  const mainClassName =
    mainVariant === "flush"
      ? "aurora-shell__main aurora-shell__main--flush"
      : "aurora-shell__main";

  return (
    <div className="aurora-shell">
      <AppSidebar />
      <div className="aurora-shell__wrapper">
        <AppHeader onToggleMenu={() => setIsMenuOpen(true)} />
        <MobileShellNav />
        <main className={mainClassName}>{children}</main>
        <footer className="aurora-footer">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 12,
              color: "var(--text-muted)",
            }}
          >
            <span>The Creator Shop v4.1</span>
            <span>© 2026</span>
          </div>
        </footer>
      </div>
      <MobileNavigation
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />
      <MobileBottomNav />
    </div>
  );
}
