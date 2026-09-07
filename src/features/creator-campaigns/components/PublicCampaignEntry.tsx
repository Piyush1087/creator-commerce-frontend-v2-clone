import { useAuthSession } from "../../../shared/auth/use-auth-session";
import { CreatorWorkspaceActorProvider } from "../../../shared/creator/creator-workspace-actor-context";
import { sessionIdentity } from "../api/c03-scope";
import { CampaignAuthority, ScopedCampaigns } from "./CampaignAuthority";
import { OpportunityWorkspace } from "./OpportunityWorkspace";
import "../creator-campaigns.css";

export function PublicCampaignEntry() {
  const session = useAuthSession();
  if (session.status === "INITIALIZING" || session.status === "REFRESHING")
    return (
      <main className="cc-workspace">
        <h1>Campaign opportunity entry</h1>
        <p role="status">Checking session…</p>
      </main>
    );
  const creator =
    session.status === "AUTHENTICATED" &&
    session.currentUser?.role.toUpperCase() === "CREATOR";
  return (
    <main className="cc-workspace c03-content">
      <CreatorWorkspaceActorProvider
        key={sessionIdentity()}
        enabled={creator}
        actorUserId={session.currentUser?.id}
      >
        {creator ? (
          <CampaignAuthority>
            <OpportunityWorkspace />
          </CampaignAuthority>
        ) : (
          <ScopedCampaigns key={sessionIdentity()}>
            <OpportunityWorkspace />
          </ScopedCampaigns>
        )}
      </CreatorWorkspaceActorProvider>
    </main>
  );
}
