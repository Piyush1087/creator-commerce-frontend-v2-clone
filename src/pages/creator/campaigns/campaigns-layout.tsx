import { NavLink, Outlet } from "react-router-dom";
import "../../../../features/creator-campaigns/creator-campaigns.css";

export function CampaignsLayout() {
  return (
    <div className="cc-workspace">
      <nav className="aurora-tabs" aria-label="Campaigns">
        <NavLink
          className={({ isActive }) =>
            `aurora-tab${isActive ? " aurora-tab--active" : ""}`
          }
          to="/creator/campaigns/opportunities"
        >
          Opportunities
        </NavLink>
        <NavLink
          className={({ isActive }) =>
            `aurora-tab${isActive ? " aurora-tab--active" : ""}`
          }
          to="/creator/campaigns/applications"
        >
          My Applications
        </NavLink>
      </nav>
      <Outlet />
    </div>
  );
}
