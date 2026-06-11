import { CampaignPipelineWorkspace, type PipelineTab } from "./CampaignPipelineWorkspace";

interface CampaignDetailTabsProps {
  campaignId: string;
  campaignName: string;
  activeTab: PipelineTab;
  onTabChange?: (tab: PipelineTab) => void;
}

/** @deprecated Use CampaignPipelineWorkspace with controlled tab state instead */
export function CampaignDetailTabs({
  campaignId,
  campaignName,
  activeTab,
  onTabChange,
}: CampaignDetailTabsProps) {
  return (
    <CampaignPipelineWorkspace
      campaignId={campaignId}
      campaignName={campaignName}
      activeTab={activeTab}
      onTabChange={onTabChange ?? (() => undefined)}
    />
  );
}

export type { PipelineTab };
