export type SurfaceState = "READY" | "EMPTY" | "UNAVAILABLE" | "ERROR";
export type CapabilityPresentation = "ENABLED" | "DISABLED" | "HIDDEN";
export type ShareChannel = "COPY_LINK" | "WHATSAPP" | "INSTAGRAM" | "NATIVE_SHARE";

export interface Capability {
  available: boolean;
  presentation: CapabilityPresentation;
  reasonCategory?: string;
}

export interface CampaignPageView {
  campaign: {
    id: string;
    name: string;
    lifecycleStatus: "DRAFT" | "PUBLISHED" | "LIVE" | "PAUSED" | "COMPLETED" | "ARCHIVED";
    creationSource: "MANUAL" | "AI_RECOMMENDED";
    productCount: number;
    briefCount: number;
    capabilities: Record<string, Capability>;
  };
  hydration: {
    outcome: string;
    executionReady: boolean;
    primaryFocus: string;
    postLiveReadinessBlocked: boolean;
  };
  productsBriefsSummary: {
    state: SurfaceState;
    label?: string;
    capability?: Capability;
    products: Array<{
      campaignAssetId: string;
      name: string;
      status?: string;
      briefs: Array<{ briefId: string; name: string; status?: string }>;
    }>;
  };
  copilotSummary: {
    state: SurfaceState;
    label?: string;
    summary?: string;
    actions: Array<{ id: string; label: string; context?: string; action: string }>;
  };
  performanceSummary: {
    state: SurfaceState;
    label?: string;
    capability?: Capability;
    metrics: Array<{
      metricId: string;
      label: string;
      value: string;
      tone: "neutral" | "success" | "attention";
    }>;
  };
  workspaces: Array<{
    workspace: "DISCOVERY" | "APPLICANTS" | "COLLABORATIONS";
    state: SurfaceState;
    instantiated: boolean;
    visible: boolean;
    count?: number;
    expand: Capability;
  }>;
  share: { capability: Capability; supportedChannels: ShareChannel[] };
  details?: {
    state: SurfaceState;
    objective: string | null;
    platforms: unknown;
    visibilityScopes: string[];
    compensationType: string | null;
    budgetPool: number | null;
    timelineType: string | null;
  };
}

export interface DiscoveryWorkspaceView {
  state: SurfaceState;
  creators: Array<{
    campaignCreatorId: string;
    name: string;
    category: string;
    followers: string;
    engagement: string;
    avatarInitials: string;
    contextLabel?: string;
  }>;
}

export interface ApplicantsWorkspaceView {
  state: SurfaceState;
  applicants: Array<{
    applicationId: string;
    campaignCreatorId: string;
    name: string;
    category: string;
    followers: string;
    engagement: string;
    avatarInitials: string;
    applicationStatus?:
      | "PENDING"
      | "APPROVED"
      | "REJECTED"
      | "SUPERSEDED"
      | "WITHDRAWN"
      | "EXPIRED";
    source?: string;
    appliedAt?: string;
    intelligenceStatus: "PROCESSING" | "READY" | "UNAVAILABLE";
    intelligenceLabel?: string;
  }>;
}
