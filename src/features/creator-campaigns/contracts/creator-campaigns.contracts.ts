export type MarketplaceCompensationTeaser = {
  compensation_type: string | null;
  fixed_fee_amount: number | null;
  negotiable_min_fee: number | null;
  negotiable_max_fee: number | null;
};

export type MarketplaceCampaignRow = {
  campaign_id: string;
  campaign_name: string | null;
  brand_name: string | null;
  brand_slug?: string | null;
  brand_logo_url?: string | null;
  industry_vertical: string | null;
  core_objective: string | null;
  hero_image_url: string | null;
  creator_archetypes: string[] | null;
  match_score_percent: number | null;
  is_eligible: boolean;
  is_invited: boolean;
  already_applied: boolean;
  application_scope: string | null;
  compensation_teaser: MarketplaceCompensationTeaser | null;
};

export type MarketplaceListResponse = {
  access_tier: string | null;
  is_social_connected: boolean;
  is_authenticated?: boolean;
  total_count: number;
  campaigns: MarketplaceCampaignRow[];
};

export type MarketplaceDetailBriefSection = {
  brief_id: string;
  title: string | null;
  body: string | null;
};

export type MarketplaceDetailProduct = {
  product_id: string;
  product_name: string | null;
  image_url: string | null;
  inventory_count: number | null;
  out_of_stock: boolean;
};

export type MarketplaceDetailBrief = {
  brief_id: string;
  internal_title: string | null;
  product_id: string | null;
  deliverable_format_tags: string[] | null;
  required_platforms: string[] | null;
};

export type MarketplaceListQuery = {
  search_query?: string;
  brand_slug?: string;
  show_match_eligible_only?: boolean;
  niche?: string;
  deliverable_type?: string;
  creator_tier?: string[];
  target_geography?: string;
  production_timeline?: string[];
};

export type MarketplaceDetailUiState = "teaser" | "unlocked" | "locked" | "invite";

export type MarketplaceDetailResponse = {
  access_tier: string | null;
  is_social_connected: boolean;
  is_authenticated?: boolean;
  is_eligible: boolean;
  is_invited?: boolean;
  invite_token?: string | null;
  ui_access_state: MarketplaceDetailUiState;
  match_score_percent: number | null;
  already_applied: boolean;
  application_scope: string | null;
  registration_cta?: { label: string; login_path: string };
  campaign: {
    campaign_id: string;
    campaign_name: string | null;
    brand_name: string | null;
    brand_logo_url: string | null;
    brand_tagline: string | null;
    brand_slug?: string | null;
    core_objective: string | null;
    execution_window: string | null;
    channels: string[] | null;
    industry_vertical: string | null;
    creator_archetypes: string[] | null;
    compensation_teaser: MarketplaceCompensationTeaser | null;
    product_name: string | null;
    product_image_url: string | null;
    product_retail_value: number | null;
  };
  brief_sections: MarketplaceDetailBriefSection[] | null;
  products: MarketplaceDetailProduct[];
  briefs: MarketplaceDetailBrief[];
};

export type MarketplaceAlternativesResponse = {
  source_campaign_id: string;
  campaigns: MarketplaceCampaignRow[];
};

export type MarketplaceShareLinkResponse = {
  campaign_id: string;
  share_url: string;
  brand_landing_url: string | null;
  invite_token: string | null;
  uses_invitation_token: boolean;
};

export type InvitationResolveResponse = {
  invitation_token: string;
  collaboration_id: string;
  campaign_id: string;
  campaign_name: string | null;
  application_scope: string | null;
  instagram_handle: string;
  collab_status: string;
  is_claimable: boolean;
};

export type VelocityAlertRow = {
  collaboration_id: string;
  tone: "amber" | "critical";
  headline: string | null;
  body: string | null;
  cta_label: string | null;
  campaign_id: string | null;
  current_phase?: string | null;
  production_deadline_at?: string | null;
};

export type PanicPanelAlert = {
  id: string;
  campaign_id: string;
  campaign_name: string;
  current_phase: string;
  production_deadline_at: string | null;
};

export type PanicPanelPayload = {
  hasUrgentAlerts: boolean;
  alertCount: number;
  alerts: PanicPanelAlert[];
};

export type CommandCenterQuery = {
  currentView?: "ACTIVE_PRODUCTION" | "PENDING_APPLICATIONS";
  searchQuery?: string;
  platformFilter?: string;
  dependencyFilter?: "AWAITING_CREATOR" | "AWAITING_BRAND" | "ALL";
};

export type ActiveCollaborationRow = {
  collaboration_id: string;
  campaign_id: string;
  brand_name: string | null;
  brand_avatar_url: string | null;
  campaign_name: string | null;
  content_format: string | null;
  current_phase?: string | null;
  action_required_by_role?: string | null;
  production_deadline_at?: string | null;
  milestone_label: string | null;
  milestone_subtext: string | null;
  cta_label: string | null;
  cta_variant: "primary" | "outline" | "ghost" | "disabled" | null;
  workflow_collaboration_id: string | null;
};

export type PendingCollaborationRowApi = {
  collaboration_id: string;
  campaign_id: string;
  brand_name: string | null;
  brand_avatar_url: string | null;
  campaign_name: string | null;
  current_phase?: string | null;
  action_required_by_role?: string | null;
  status_label: string | null;
  context_copy: string | null;
  cta_label: string | null;
  kind: "invitation" | "application" | null;
  invitation_token: string | null;
};

export type CampaignsWorkspaceResponse = {
  current_view?: string;
  active_count: number;
  pending_count: number;
  completed_count: number;
  panic_panel?: PanicPanelPayload;
  velocity_alerts: VelocityAlertRow[];
  active_rows: ActiveCollaborationRow[];
  pending_rows: PendingCollaborationRowApi[];
};

export type HistoryStats = {
  total_escrow_extracted: number | null;
  deliverables_dispatched: number | null;
  avg_match_retention: number | null;
};

export type HistoryCollaborationRowApi = {
  collaboration_id: string;
  brand_name: string | null;
  campaign_name: string | null;
  current_phase?: string | null;
  closed_label: string | null;
  payout_amount: number | null;
  closed_at: string | null;
};

export type HistoryArchiveQuery = {
  page?: number;
  limit?: number;
  archiveStatus?: "ARCHIVED_COMPLETED" | "ARCHIVED_CLOSED" | "ALL";
};

export type CampaignsHistoryResponse = {
  page?: number;
  limit?: number;
  total?: number;
  stats: HistoryStats;
  rows: HistoryCollaborationRowApi[];
};
