type AppHeaderProps = {
  isMenuOpen: boolean;
  onToggleMenu: () => void;
};

export function AppHeader({ isMenuOpen, onToggleMenu }: AppHeaderProps) {
  return (
    <header className="aurora-header">
      <div className="aurora-header__breadcrumbs" aria-label="Breadcrumb">
        <span>TheCreatorShop</span>
        <span>/</span>
        <span className="aurora-header__current">Aurora Playground</span>
      </div>
      <div className="aurora-header__actions">
        <button
          aria-label="Notifications"
          className="aurora-header__icon-button"
          type="button"
        >
          N
        </button>
        <button
          aria-expanded={isMenuOpen}
          aria-label="Open navigation menu"
          className="aurora-header__icon-button aurora-header__menu"
          onClick={onToggleMenu}
          type="button"
        >
          M
        </button>
      </div>
    </header>
  );
}
