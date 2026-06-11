import { Card } from "../../../design-system/aurora";
import { loadAuthSession } from "../../../shared/auth/auth-session";

export function BrandDashboardPage() {
  const session = loadAuthSession();

  return (
    <div className="dashboard-content" style={{ maxWidth: 480, margin: "0 auto" }}>
      <Card className="bob-auth-card bob-auth-card--center">
        <h1 className="aurora-card__title" style={{ marginBottom: 12 }}>
          Dashboard
        </h1>
        <p className="bob-muted" style={{ margin: 0 }}>
          Coming soon.
          {session?.user.email ? ` You are signed in as ${session.user.email}.` : ""}
        </p>
      </Card>
    </div>
  );
}
