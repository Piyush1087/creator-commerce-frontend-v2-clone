import { navigationItems, utilityItems } from "./navigation";

export function AppSidebar() {
  return (
    <aside className="aurora-sidebar" aria-label="Primary navigation">
      <div>
        <div className="aurora-sidebar__brand">
          <span className="aurora-sidebar__mark">T</span>
          <div>
            <div className="aurora-sidebar__name">TheCreatorShop</div>
            <div className="aurora-sidebar__stage">Aurora v4.1</div>
          </div>
        </div>
        <nav className="aurora-sidebar__nav">
          {navigationItems.map((item) => (
            <a
              className={
                item.active
                  ? "aurora-sidebar__link aurora-sidebar__link--active"
                  : "aurora-sidebar__link"
              }
              href="#"
              key={item.label}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
      </div>
      <nav className="aurora-sidebar__nav" aria-label="Utility navigation">
        {utilityItems.map((item) => (
          <a className="aurora-sidebar__link" href="#" key={item.label}>
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </a>
        ))}
      </nav>
    </aside>
  );
}
