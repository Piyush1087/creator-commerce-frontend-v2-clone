import { navigationItems } from "./navigation";

type MobileNavigationProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function MobileNavigation({ isOpen, onClose }: MobileNavigationProps) {
  return (
    <>
      {isOpen && (
        <aside className="aurora-mobile-drawer" aria-label="Mobile navigation">
          <div className="aurora-mobile-drawer__header">
            <span className="aurora-mobile-drawer__title">Navigation</span>
            <button
              aria-label="Close navigation menu"
              className="aurora-header__icon-button"
              onClick={onClose}
              type="button"
            >
              X
            </button>
          </div>
          <nav className="aurora-mobile-drawer__nav">
            {navigationItems.map((item) => (
              <a
                className={
                  item.active
                    ? "aurora-mobile-drawer__link aurora-mobile-drawer__link--active"
                    : "aurora-mobile-drawer__link"
                }
                href="#"
                key={item.label}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </a>
            ))}
          </nav>
        </aside>
      )}
      <nav className="aurora-bottom-nav" aria-label="Mobile bottom navigation">
        {navigationItems.slice(0, 4).map((item) => (
          <button
            className={
              item.active
                ? "aurora-bottom-nav__item aurora-bottom-nav__item--active"
                : "aurora-bottom-nav__item"
            }
            key={item.label}
            type="button"
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
