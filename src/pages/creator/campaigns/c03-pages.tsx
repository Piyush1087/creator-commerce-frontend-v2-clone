import { OpportunityCollection } from "../../../features/creator-campaigns/components/OpportunityCollection";
import { OpportunityWorkspace } from "../../../features/creator-campaigns/components/OpportunityWorkspace";
import { PublicCampaignEntry } from "../../../features/creator-campaigns/components/PublicCampaignEntry";
import { ApplicationCollection } from "../../../features/creator-campaigns/components/ApplicationCollection";
import { ApplicationWorkspace } from "../../../features/creator-campaigns/components/ApplicationWorkspace";
export function OpportunitiesPage() {
  return <OpportunityCollection />;
}
export function OpportunityPage() {
  return <OpportunityWorkspace />;
}
export function ApplicationsPage() {
  return <ApplicationCollection />;
}
export function ApplicationPage() {
  return <ApplicationWorkspace />;
}
export function PublicCampaignPage() {
  return <PublicCampaignEntry />;
}
