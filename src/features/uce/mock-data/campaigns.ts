import { CampaignSummary, SpendReport } from "../types";

export const MOCK_CAMPAIGNS: CampaignSummary[] = [
  {
    id: "CAM-001",
    name: "Spring Glow 2024",
    objective: "Awareness",
    status: "LIVE",
    influencerCount: 42,
    budget: {
      consumed: 8400,
      total: 12000,
    },
    endDate: "Sep 30, 2024",
  },
  {
    id: "CAM-002",
    name: "Back to School Tech Drive",
    objective: "Sales",
    status: "LIVE",
    influencerCount: 15,
    budget: {
      consumed: 15000,
      total: 50000,
    },
    endDate: "Aug 15, 2024",
  },
  {
    id: "CAM-003",
    name: "Holiday Gifting Preview",
    objective: "Traffic",
    status: "DRAFT",
    influencerCount: 0,
    budget: {
      consumed: 0,
      total: 25000,
    },
    endDate: "Dec 24, 2024",
  },
];

export const MOCK_SPEND_REPORT: SpendReport = {
  settledPayouts: 20000,
  committedEscrow: 12400,
  unallocatedCapFloor: 6100,
  logistics: {
    inTransit: 12,
    delivered: 28,
    stalled: 3,
  },
  audienceDistribution: {
    macro: 15,
    midTier: 35,
    micro: 50,
  },
  masterBudget: 50000,
  productSubCeiling: 15000,
};

const LEGACY_ID_MAP: Record<string, string> = {
  "1": "CAM-001",
  "2": "CAM-002",
  "3": "CAM-003",
};

export function normalizeCampaignId(id: string): string {
  return LEGACY_ID_MAP[id] ?? id;
}

export function getCampaignById(id: string | undefined): CampaignSummary | undefined {
  if (!id) return undefined;
  const normalized = normalizeCampaignId(id);
  return MOCK_CAMPAIGNS.find((c) => c.id === normalized);
}

export function buildCampaignDetailPath(campaignId: string): string {
  return `/brand/uce/campaigns/${campaignId}`;
}
