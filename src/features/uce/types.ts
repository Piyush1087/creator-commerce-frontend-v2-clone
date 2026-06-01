export type CampaignStatus = "LIVE" | "PAUSED" | "DRAFT" | "COMPLETED";

export interface CampaignSummary {
  id: string;
  name: string;
  objective: string;
  status: CampaignStatus;
  influencerCount: number;
  budget: {
    consumed: number;
    total: number;
  };
  endDate: string;
}

export interface SpendReport {
  settledPayouts: number;
  committedEscrow: number;
  unallocatedCapFloor: number;
  logistics: {
    inTransit: number;
    delivered: number;
    stalled: number;
  };
  audienceDistribution: {
    macro: number;
    midTier: number;
    micro: number;
  };
  masterBudget: number;
  productSubCeiling: number;
}
