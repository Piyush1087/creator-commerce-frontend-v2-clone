import { Button, Card } from "../../../design-system/aurora";
import { useAuthSession } from "../../../shared/auth/use-auth-session";
import { useLogout } from "../../../shared/auth/use-logout";

export function BrandDashboardPlaceholder() {
  const session = useAuthSession();
  const logout = useLogout();

  return (
    <div
      className="bob-landing"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}
    >
      <Card className="bob-auth-card bob-auth-card--center">
        <h1 className="aurora-card__title" style={{ marginBottom: 12 }}>
          Brand dashboard
        </h1>
        <p className="bob-muted" style={{ marginBottom: 24 }}>
          Coming soon. You are signed in
          {session.currentUser?.email ? ` as ${session.currentUser.email}` : ""}
          .
        </p>
        <Button type="button" variant="secondary" onClick={logout}>
          Log out
        </Button>
      </Card>
    </div>
  );
}
