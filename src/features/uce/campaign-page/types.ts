export type SurfaceState = "READY" | "EMPTY" | "UNAVAILABLE" | "ERROR";
export type CapabilityPresentation = "ENABLED" | "DISABLED" | "HIDDEN";
export type ShareChannel =
  | "COPY_LINK"
  | "WHATSAPP"
  | "INSTAGRAM"
  | "NATIVE_SHARE";

export interface Capability {
  available: boolean;
  presentation: CapabilityPresentation;
  reasonCategory?: string;
}

export interface CampaignDetailsView {
  state: SurfaceState;
  objective: string | null;
  platforms: unknown;
  visibilityScopes: string[];
  compensationType: string | null;
  budgetPool: number | null;
  timelineType: string | null;
}

export interface CampaignPageView {
  campaign: {
    id: string;
    name: string;
    lifecycleStatus:
      | "DRAFT"
      | "PUBLISHED"
      | "LIVE"
      | "PAUSED"
      | "COMPLETED"
      | "ARCHIVED";
    creationSource: "MANUAL" | "AI_RECOMMENDED";
    assetCount: number;
    canonicalBriefCount: number;
    legacyProductCount: number;
    legacyBriefCount: number;
    capabilities: Record<string, Capability>;
  };
  readiness: {
    ready: boolean;
    missingRequirements: string[];
    remediation: Array<{ requirement: string; message: string }>;
    activeAssetCount: number;
    readyBriefCount: number;
  };
  hydration: {
    outcome: string;
    executionReady: boolean;
    primaryFocus: string;
    postLiveReadinessBlocked: boolean;
  };
  assetsBriefsSummary: {
    state: SurfaceState;
    label: string;
    capability: Capability;
    assets: CanonicalCampaignAsset[];
  };
  productsBriefsSummary: {
    authority: "LEGACY_COMPATIBILITY";
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
    actions: Array<{
      id: string;
      label: string;
      context?: string;
      action: string;
    }>;
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
    message?: string;
  };
  workspaces: Array<{
    workspace: CampaignWorkspaceId;
    state: SurfaceState;
    instantiated: boolean;
    visible: boolean;
    count?: number;
    pendingCount?: number;
    rejectedCount?: number;
    expand: Capability;
  }>;
  share: { capability: Capability; supportedChannels: ShareChannel[] };
  details?: CampaignDetailsView;
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
  provider: {
    availability: "UNAVAILABLE";
    message: string;
    results: [];
  };
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
    campaignAssetId?: string | null;
    briefId?: string | null;
    canonicalCampaignAssetId?: null;
    canonicalBriefId?: null;
    referenceAuthority?: "LEGACY_COMPATIBILITY";
    intelligenceStatus: "PROCESSING" | "READY" | "UNAVAILABLE";
    intelligenceLabel?: string;
  }>;
}

export interface CreatorProfileView {
  state: SurfaceState;
  campaignCreatorId: string;
  name: string;
  email?: string | null;
  platform: string;
  source: string;
  reviewState: string;
  applications: Array<{
    applicationId: string;
    status: string;
    source: string;
    appliedAt: string;
    briefId?: string;
    campaignAssetId?: string;
    canonicalCampaignAssetId?: null;
    canonicalBriefId?: null;
    referenceAuthority?: "LEGACY_COMPATIBILITY";
  }>;
}

export type CampaignWorkspaceId = "discovery" | "applicants" | "collaborations";
export type CanonicalCampaignAssetKind = "BRAND" | "OFFERING" | "OFFER";

export interface SelectableCampaignAsset {
  kind: CanonicalCampaignAssetKind;
  entity_id: string;
  label: string;
  subtype: string | null;
  image_url: string | null;
}

export interface LinkedCampaignAsset extends SelectableCampaignAsset {
  campaign_asset_id: string;
  status: "ACTIVE" | "PAUSED";
}

export interface CanonicalBriefDeliverable {
  deliverableId: string;
  format: string;
  quantity: number;
  creativeRequirements: string;
  publishingRequired: boolean;
}

export interface CanonicalCampaignBriefSummary {
  briefId: string;
  name: string;
  status: "PUBLISHED" | "PAUSED";
  creativeRequirements: string;
  deliverables: CanonicalBriefDeliverable[];
}

export interface CanonicalCampaignAsset {
  campaignAssetId: string;
  kind: CanonicalCampaignAssetKind;
  status: "ACTIVE" | "PAUSED";
  entityId: string | null;
  name: string;
  subtype: string | null;
  imageUrl: string | null;
  briefs: CanonicalCampaignBriefSummary[];
}

export interface CanonicalBriefRecord {
  brief_id: string;
  campaign_asset_id: string;
  title: string;
  creative_requirements: string;
  is_active: boolean;
  deliverables: Array<{
    deliverable_id: string;
    format: string;
    quantity: number;
    creative_requirements: string;
    publishing_required: boolean;
  }>;
  readiness: { ready: boolean; missing_requirements: string[] };
  created_at: string;
}

export interface CanonicalBriefWriteBody {
  title: string;
  creative_requirements: string;
  deliverables: Array<{
    format: string;
    quantity: number;
    creative_requirements: string;
    publishing_required: boolean;
  }>;
}

export interface CreateCanonicalBriefBody extends CanonicalBriefWriteBody {
  campaign_asset_id: string;
}

export interface OutreachComposerView {
  ok: true;
  campaignId: string;
  campaignCreatorId: string;
  channel: "EMAIL" | "PRIORITY_DM";
  subject?: string;
  body: string;
}
