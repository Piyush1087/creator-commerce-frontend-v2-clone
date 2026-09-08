import { Link } from "react-router-dom";

import { Alert, Button, Card } from "../../../design-system/aurora";
import { AUTH_ROUTES } from "../../../features/auth/constants";
import { useAuthSession } from "../../../shared/auth/use-auth-session";

/**
 * C-05 workspace entry only. Accepted C-02A Home is deferred from this freeze.
 */
export function CreatorWorkspaceEntryPage() {
  const session = useAuthSession();

  return (
    <div
      className="dashboard-content"
      style={{ maxWidth: 640, margin: "0 auto" }}
    >
      <Alert title="Creator Home is deferred" tone="warning">
        Accepted C-02A Home is not part of this freeze. This page is the C-05
        workspace entry only.
      </Alert>
      <Card
        className="bob-auth-card"
        style={{ marginTop: 24 }}
        eyebrow="Creator workspace"
        title="Continue in the accepted product"
      >
        <p className="bob-muted" style={{ margin: "0 0 16px" }}>
          Campaigns, Brand-side Collaborations, and Settings remain available.
          {session.currentUser?.email
            ? ` Signed in as ${session.currentUser.email}.`
            : ""}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <Link to={AUTH_ROUTES.creatorCampaigns}>
            <Button variant="primary">Campaigns</Button>
          </Link>
          <Link to={AUTH_ROUTES.creatorCollaborations}>
            <Button variant="secondary">Collaborations</Button>
          </Link>
          <Link to={AUTH_ROUTES.creatorSettings}>
            <Button variant="ghost">Settings</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
