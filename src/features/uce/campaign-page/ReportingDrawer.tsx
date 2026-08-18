import { Alert, Button, SideDrawer } from "../../../design-system/aurora";
import type { CampaignPageView } from "./types";

export function ReportingUnavailableContent({
  campaignName,
  performanceSummary,
}: {
  campaignName: string;
  performanceSummary: CampaignPageView["performanceSummary"];
}) {
  return (
    <div className="canonical-campaign-drawer__stack">
      <div className="canonical-campaign-drawer__context">
        <span>Campaign reporting</span>
        <strong>{campaignName}</strong>
        <p>No canonical performance values are available.</p>
      </div>
      <Alert title="Canonical reporting unavailable" tone="warning">
        {performanceSummary.message ??
          "Reporting is not available for this Campaign yet."}{" "}
        The legacy SaaS reporting payload is not used by the Campaign Page, and
        the frontend does not calculate replacement metrics.
      </Alert>
    </div>
  );
}

export function ReportingDrawer({
  campaignName,
  performanceSummary,
  isOpen,
  onClose,
}: {
  campaignName: string;
  performanceSummary: CampaignPageView["performanceSummary"];
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <SideDrawer
      closeLabel="Close Campaign Report drawer"
      isOpen={isOpen}
      onClose={onClose}
      title="Campaign Report"
      subtitle={campaignName}
      width="720px"
      footer={<Button onClick={onClose}>Done</Button>}
    >
      <ReportingUnavailableContent
        campaignName={campaignName}
        performanceSummary={performanceSummary}
      />
    </SideDrawer>
  );
}
