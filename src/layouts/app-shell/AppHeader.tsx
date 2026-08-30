import { Bell, Menu, ChevronRight } from "lucide-react";

import type { AuthUser } from "../../shared/auth/auth-session";
import { useAuthSession } from "../../shared/auth/use-auth-session";
import { Button } from "../../design-system/aurora";
import { useAppShellBreadcrumbs } from "./use-app-shell-breadcrumbs";

type AppHeaderProps = {
  onToggleMenu: () => void;
};

function userAvatarInitial(user: AuthUser | null): string {
  const name = user?.name?.trim();
  if (name && name.length > 0) {
    return name.charAt(0).toUpperCase();
  }
  const email = user?.email?.trim();
  if (email && email.length > 0) {
    return email.charAt(0).toUpperCase();
  }
  return "?";
}

export function AppHeader({ onToggleMenu }: AppHeaderProps) {
  const session = useAuthSession();
  const { breadcrumb, title } = useAppShellBreadcrumbs();

  return (
    <header className="aurora-header">
      <div className="aurora-header__left">
        <div className="aurora-header__logo">
          <div className="aurora-header__logo-mark">T</div>
        </div>
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
            {userAvatarInitial(session.currentUser)}
          </div>
        </div>

        <button
          type="button"
          className="aurora-header__btn aurora-header__menu-trigger"
          onClick={onToggleMenu}
          aria-label="Open Menu"
        >
          <Menu size={18} />
        </button>
      </div>
    </header>
  );
}
