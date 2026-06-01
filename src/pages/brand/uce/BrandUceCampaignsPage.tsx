import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "../../../design-system/aurora/components/Button";
import { CampaignListTabs } from "../../../features/uce/components/CampaignListTabs";
import { AUTH_ROUTES } from "../../../features/auth/constants";
import "./BrandUceCampaignsPage.css";
import "../../../features/uce/uce-responsive.css";

export function BrandUceCampaignsPage() {
  const navigate = useNavigate();

  return (
    <div className="brand-uce-campaigns-page">
      <header className="page-header">
        <div className="header-info">
          <h1 className="page-title">Your Campaigns</h1>
          <p className="page-subtitle">
            Track, manage, and optimize your creator activations from a single view.
          </p>
        </div>
        <div className="header-actions">
          <Button variant="outline">✨ Create using AI</Button>
          <Button onClick={() => navigate(AUTH_ROUTES.brandUceCampaignCreate)}>
            <Plus size={18} />
            Create New Campaign
          </Button>
        </div>
      </header>

      <main className="page-content">
        <CampaignListTabs />
      </main>
    </div>
  );
}
