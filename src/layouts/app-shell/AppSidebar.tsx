import { Link, useLocation } from "react-router-dom";
import { navigationItems, utilityItems } from "./navigation";
import { Button } from "../../design-system/aurora";

export function AppSidebar() {
  const location = useLocation();

  return (
    <aside className="aurora-sidebar">
      <div className="aurora-sidebar__brand">
        <div className="aurora-sidebar__logo-mark">T</div>
        <span className="aurora-sidebar__logo-text">TheCreatorShop</span>
      </div>

      <nav className="aurora-sidebar__nav">
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.label}
              to={item.path}
              className={`aurora-sidebar__link ${isActive ? "aurora-sidebar__link--active" : ""}`}
            >
              <span className="aurora-sidebar__icon">
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              </span>
              <span className="aurora-sidebar__label">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="aurora-sidebar__footer">
        {utilityItems.map((item) => (
          <Link key={item.label} to={item.path} className="aurora-sidebar__link">
            <span className="aurora-sidebar__icon">
              <item.icon size={20} />
            </span>
            <span className="aurora-sidebar__label">{item.label}</span>
          </Link>
        ))}
        <div className="aurora-sidebar__upgrade">
          <Button style={{ width: "100%", height: 40, fontSize: 13 }}>
            Upgrade Plan
          </Button>
        </div>
      </div>
    </aside>
  );
}
