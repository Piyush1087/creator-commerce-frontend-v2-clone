import { NavLink } from "react-router-dom";
import { AUTH_ROUTES } from "../../../features/auth/constants";

export function CreatorInsightsNav({
  current,
}: {
  current: "audience" | "content";
}) {
  return (
    <nav
      className="creator-insights-nav"
      aria-label="Creator Insights sections"
    >
      <NavLink
        aria-current={current === "audience" ? "page" : undefined}
        to={AUTH_ROUTES.creatorAudience}
      >
        Audience
      </NavLink>
      <NavLink
        aria-current={current === "content" ? "page" : undefined}
        to={AUTH_ROUTES.creatorContent}
      >
        Content
      </NavLink>
    </nav>
  );
}
