import { X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { navigationItems } from "./navigation";

type MobileNavigationProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function MobileNavigation({ isOpen, onClose }: MobileNavigationProps) {
  const location = useLocation();

  return (
    <>
      <div 
        className={`aurora-drawer-overlay ${isOpen ? "aurora-drawer-overlay--open" : ""}`} 
        onClick={onClose} 
      />
      <aside className={`aurora-drawer ${isOpen ? "aurora-drawer--open" : ""}`}>
        <div className="aurora-drawer__header">
          <span className="aurora-drawer__title">The Creator Shop</span>
          <button 
            className="aurora-header__btn" 
            onClick={onClose}
            style={{ border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.6)' }}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="aurora-drawer__nav">
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.label}
                to={item.path}
                className={`aurora-drawer__link ${isActive ? "aurora-drawer__link--active" : ""}`}
                onClick={onClose}
              >
                <item.icon size={20} style={{ marginRight: 12 }} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Bottom Navigation - Spread evenly, non-sticky */}
      <nav className="aurora-bottom-nav">
        {navigationItems.slice(0, 4).map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.label}
              to={item.path}
              className={`aurora-bottom-nav__item ${isActive ? "aurora-bottom-nav__item--active" : ""}`}
            >
              <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
