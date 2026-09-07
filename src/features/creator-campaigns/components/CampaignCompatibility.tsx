import { Navigate, useParams } from "react-router-dom";
import { idSchema } from "../contracts/c03.contracts";
import { retiredInvitationEntry } from "../api/c03-entry";

export function CampaignUnavailable({
  invitation = false,
}: {
  invitation?: boolean;
}) {
  return (
    <section className="cc-workspace">
      <h1>Campaign opportunity entry</h1>
      <p>
        {invitation || retiredInvitationEntry
          ? "Ask the Brand for a fresh secure Campaign link."
          : "This entry is unavailable. Open a Campaign link provided by the Brand."}
      </p>
    </section>
  );
}
export function LegacyCampaignRedirect({
  creator = false,
}: {
  creator?: boolean;
}) {
  const { campaignId } = useParams();
  if (!idSchema.safeParse(campaignId).success) return <CampaignUnavailable />;
  return (
    <Navigate
      replace
      to={`${creator ? "/creator/campaigns/opportunities" : "/campaigns"}/${campaignId}`}
    />
  );
}
