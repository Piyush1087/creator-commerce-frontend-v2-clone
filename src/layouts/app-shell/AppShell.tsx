import { useEffect, useState, type PropsWithChildren } from "react";

import { AppHeader } from "./AppHeader";
import { AppSidebar } from "./AppSidebar";
import { MobileNavigation } from "./MobileNavigation";

export function AppShell({ children }: PropsWithChildren) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  return (
    <div className="aurora-shell">
      <AppSidebar />
      <div className="aurora-shell__content">
        <AppHeader
          isMenuOpen={isMenuOpen}
          onToggleMenu={() => setIsMenuOpen((current) => !current)}
        />
        <main className="aurora-shell__main">{children}</main>
      </div>
      <MobileNavigation
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />
    </div>
  );
}
