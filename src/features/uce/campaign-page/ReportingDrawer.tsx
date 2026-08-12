import { Alert, Button, SideDrawer } from "../../../design-system/aurora";
import type { CampaignPageView } from "./types";

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
      isOpen={isOpen}
      onClose={onClose}
      title="Campaign Report"
      subtitle={campaignName}
      width="720px"
      footer={<Button onClick={onClose}>Done</Button>}
    >
      <div className="canonical-campaign-drawer__stack">
        {performanceSummary.state === "READY" ? (
          <section>
            <h3 className="canonical-campaign-drawer__section-title">Performance summary</h3>
            <div className="canonical-campaign-page__metrics">
              {performanceSummary.metrics.map((metric) => (
                <div key={metric.metricId}>
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                </div>
              ))}
            </div>
          </section>
        ) : null}
        <Alert title="Detailed reporting projection pending" tone="warning">
          The legacy SaaS reporting payload is not used by the new Campaign Page. Detailed Campaign reporting will populate this surface only from the accepted canonical Reporting/Intelligence projection; no metrics or insights are calculated in the frontend.
        </Alert>
      </div>
    </SideDrawer>
  );
}
