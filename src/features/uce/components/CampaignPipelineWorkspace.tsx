import { ApplicantsTabPanel } from "./tabs/ApplicantsTabPanel";
import { ActiveCollabsTabPanel } from "./tabs/ActiveCollabsTabPanel";
import { ProspectsTabPanel } from "./tabs/ProspectsTabPanel";
import { ReportingTabPanel } from "./tabs/ReportingTabPanel";
import "./CampaignPipelineTabs.css";

export type PipelineTab = "prospects" | "applicants" | "active" | "reporting";

const TABS: { id: PipelineTab; label: string }[] = [
  { id: "prospects", label: "Prospects" },
  { id: "applicants", label: "Applicants" },
  { id: "active", label: "Active Collabs" },
  { id: "reporting", label: "Reporting" },
];

type CampaignPipelineWorkspaceProps = {
  campaignId: string;
  campaignName: string;
  activeTab: PipelineTab;
  onTabChange: (tab: PipelineTab) => void;
};

export function CampaignPipelineWorkspace({
  campaignId,
  campaignName,
  activeTab,
  onTabChange,
}: CampaignPipelineWorkspaceProps) {
  return (
    <section className="uce-pipeline-workspace">
      <div className="uce-pipeline-tabs-bar">
        <div className="uce-pipeline-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`uce-pipeline-tab ${activeTab === tab.id ? "is-active" : ""}`}
              onClick={() => onTabChange(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="uce-pipeline-canvas">
        {activeTab === "prospects" && (
          <ProspectsTabPanel campaignId={campaignId} campaignName={campaignName} />
        )}
        {activeTab === "applicants" && (
          <ApplicantsTabPanel campaignId={campaignId} campaignName={campaignName} />
        )}
        {activeTab === "active" && (
          <ActiveCollabsTabPanel campaignId={campaignId} campaignName={campaignName} />
        )}
        {activeTab === "reporting" && (
          <ReportingTabPanel campaignId={campaignId} campaignName={campaignName} />
        )}
      </div>
    </section>
  );
}
