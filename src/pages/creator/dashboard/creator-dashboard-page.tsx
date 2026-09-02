import { Link } from "react-router-dom";

import { Button, Card } from "../../../design-system/aurora";
import { AUTH_ROUTES } from "../../../features/auth/constants";
import { useAuthSession } from "../../../shared/auth/use-auth-session";

export function CreatorDashboardPage() {
  const session = useAuthSession();

  return (
    <div className="dashboard-content" style={{ maxWidth: 640, margin: "0 auto" }}>
      <Card className="bob-auth-card" style={{ marginBottom: 24 }}>
        <h1 className="aurora-card__title" style={{ marginBottom: 12 }}>
          Creator dashboard
        </h1>
        <p className="bob-muted" style={{ margin: "0 0 16px" }}>
          Browse campaigns, manage applications, and open chat when a brand approves you.
          {session.currentUser?.email
            ? ` Signed in as ${session.currentUser.email}.`
            : ""}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <Link to={AUTH_ROUTES.creatorMarketplace}>
            <Button variant="primary">Open Marketplace</Button>
          </Link>
          <Link to={AUTH_ROUTES.creatorCampaigns}>
            <Button variant="outline">Campaign Command Center</Button>
          </Link>
          <Link to={AUTH_ROUTES.creatorCollaborations}>
            <Button variant="ghost">Collaboration Chat</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
