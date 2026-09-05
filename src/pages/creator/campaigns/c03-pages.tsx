import { OpportunityCollection } from "../../../features/creator-campaigns/components/OpportunityCollection";
import { OpportunityWorkspace } from "../../../features/creator-campaigns/components/OpportunityWorkspace";
import { PublicCampaignEntry } from "../../../features/creator-campaigns/components/PublicCampaignEntry";
export function OpportunitiesPage() {
  return <OpportunityCollection />;
}
export function OpportunityPage() {
  return <OpportunityWorkspace />;
}
export function ApplicationsPage() {
  return (
    <section>
      <h1>My Applications</h1>
    </section>
  );
}
export function ApplicationPage() {
  return (
    <section>
      <h1>Application</h1>
    </section>
  );
}
export function PublicCampaignPage() {
  return <PublicCampaignEntry />;
}
