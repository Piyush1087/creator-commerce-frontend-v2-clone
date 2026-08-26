import { Bell, Menu, ChevronRight } from "lucide-react";

import { loadAuthSession } from "../../shared/auth/auth-session";
import { Button } from "../../design-system/aurora";
import { useAppShellBreadcrumbs } from "./use-app-shell-breadcrumbs";

type AppHeaderProps = {
  onToggleMenu: () => void;
  brandWorkspace?: boolean;
  menuOpen?: boolean;
};

function userAvatarInitial(
  session: ReturnType<typeof loadAuthSession>,
): string {
  const name = session?.user.name?.trim();
  if (name && name.length > 0) {
    return name.charAt(0).toUpperCase();
  }
  const email = session?.user.email?.trim();
  if (email && email.length > 0) {
    return email.charAt(0).toUpperCase();
  }
  return "?";
}

export function AppHeader({
  onToggleMenu,
  brandWorkspace = false,
  menuOpen = false,
}: AppHeaderProps) {
  const session = loadAuthSession();
  const { breadcrumb, title } = useAppShellBreadcrumbs();

  return (
    <header className="aurora-header">
      <div className="aurora-header__left">
        <div className="aurora-header__logo">
          <div className="aurora-header__logo-mark">T</div>
        </div>
        {brandWorkspace ? (
          <div className="aurora-header__brand-context">
            <h1>Brand</h1>
            <span>Brand Centre</span>
          </div>
        ) : null}
        <div className="aurora-header__breadcrumbs">
          <span>{breadcrumb}</span>
          <div className="aurora-header__separator">
            <ChevronRight size={14} />
          </div>
          <span className="aurora-header__current">{title}</span>
        </div>
      </div>

      <div className="aurora-header__right">
        <Button
          variant="primary"
          style={{ height: 40, paddingInline: 24, fontSize: 13 }}
        >
          Upgrade
        </Button>

        <button
          type="button"
          className="aurora-header__btn"
          aria-label="Notifications"
        >
          <Bell size={18} />
        </button>

        <div className="aurora-header__user">
          <div className="aurora-header__avatar" aria-hidden>
            {userAvatarInitial(session)}
          </div>
        </div>

        <button
          type="button"
          className="aurora-header__btn aurora-header__menu-trigger"
          onClick={onToggleMenu}
          aria-label="Open Menu"
          aria-expanded={menuOpen}
          aria-controls="application-mobile-navigation"
        >
          <Menu size={18} />
        </button>
      </div>
    </header>
  );
}
