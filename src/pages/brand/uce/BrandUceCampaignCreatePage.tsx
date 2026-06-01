import { CreateCampaignWizard } from "../../../features/uce/components/CreateCampaignWizard";
import "../../../features/uce/uce-responsive.css";
import "./BrandUceCampaignCreatePage.css";

export function BrandUceCampaignCreatePage() {
  return (
    <div className="brand-uce-campaign-create-page brand-uce-campaign-create-page--flush">
      <CreateCampaignWizard />
    </div>
  );
}
