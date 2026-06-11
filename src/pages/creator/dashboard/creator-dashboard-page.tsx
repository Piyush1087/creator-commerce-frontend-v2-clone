import { Card } from "../../../design-system/aurora";
import { CreatorCampaignsPanel } from "../../../features/creator-uce/components/CreatorCampaignsPanel";
import { loadAuthSession } from "../../../shared/auth/auth-session";

export function CreatorDashboardPage() {
  const session = loadAuthSession();

  return (
    <div className="dashboard-content" style={{ maxWidth: 640, margin: "0 auto" }}>
      <Card className="bob-auth-card" style={{ marginBottom: 24 }}>
        <h1 className="aurora-card__title" style={{ marginBottom: 12 }}>
          Creator dashboard
        </h1>
        <p className="bob-muted" style={{ margin: 0 }}>
          Apply to open campaigns below. After a brand approves you, open{" "}
          <strong>Chat</strong> to run the collaboration workflow.
          {session?.user.email ? ` Signed in as ${session.user.email}.` : ""}
        </p>
      </Card>
      <CreatorCampaignsPanel />
    </div>
  );
}
