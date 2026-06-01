import { CampaignPipelineWorkspace, type PipelineTab } from "./CampaignPipelineWorkspace";

interface CampaignDetailTabsProps {
  activeTab: PipelineTab;
  onTabChange?: (tab: PipelineTab) => void;
}

/** @deprecated Use CampaignPipelineWorkspace with controlled tab state instead */
export function CampaignDetailTabs({ activeTab, onTabChange }: CampaignDetailTabsProps) {
  return (
    <CampaignPipelineWorkspace
      activeTab={activeTab}
      onTabChange={onTabChange ?? (() => undefined)}
    />
  );
}

export type { PipelineTab };
