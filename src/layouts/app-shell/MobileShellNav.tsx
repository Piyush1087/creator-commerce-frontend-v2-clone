import { ChevronRight } from "lucide-react";

import { useAppShellBreadcrumbs } from "./use-app-shell-breadcrumbs";

export function MobileShellNav() {
  const { breadcrumb, title } = useAppShellBreadcrumbs();

  return (
    <nav className="aurora-mobile-shell-nav" aria-label="Page location">
      <span>{breadcrumb}</span>
      <ChevronRight size={14} aria-hidden className="aurora-mobile-shell-nav__separator" />
      <span className="aurora-mobile-shell-nav__current">{title}</span>
    </nav>
  );
}
