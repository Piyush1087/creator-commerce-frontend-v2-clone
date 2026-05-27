import { useEffect, useState, type PropsWithChildren } from "react";
import { AppHeader } from "./AppHeader";
import { AppSidebar } from "./AppSidebar";
import { MobileNavigation } from "./MobileNavigation";
import "./app-shell.css";

export function AppShell({ children }: PropsWithChildren) {
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

  return (
    <div className="aurora-shell">
      <AppSidebar />
      <div className="aurora-shell__wrapper">
        <AppHeader
          isMenuOpen={isMenuOpen}
          onToggleMenu={() => setIsMenuOpen(true)}
        />
        <main className="aurora-shell__main">{children}</main>
        <footer className="aurora-footer">
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-muted)" }}>
            <span>The Creator Shop v4.1</span>
            <span>© 2026</span>
          </div>
        </footer>
      </div>
      <MobileNavigation
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />
    </div>
  );
}
