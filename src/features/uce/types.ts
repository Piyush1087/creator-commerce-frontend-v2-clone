export type CampaignStatus =
  | "LIVE"
  | "PAUSED"
  | "DRAFT"
  | "COMPLETED"
  | "ARCHIVED";

export interface CampaignSummary {
  id: string;
  name: string;
  objective: string;
  status: CampaignStatus;
  influencerCount: number;
  productsConnected: number;
  /** e.g. Fixed Duration, Ongoing Pipeline */
  timelineRule: string;
  /** Segment widths for mini pipeline bar (prospects %, applicants %, active %) */
  pipelineBar: [number, number, number];
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
