export type UceCampaignStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "COMPLETED";

export type UceCampaignObjective =
  | "BRAND_AWARENESS"
  | "TRAFFIC_CLICKS"
  | "SALES_CONVERSIONS";

export type CampaignListAggregates = {
  total_active_spend: number;
  total_impressions: string;
  pipeline_bottlenecks: number;
  active_campaign_count: number;
};

export type CampaignListRow = {
  campaign_id: string;
  campaign_name: string;
  current_status: UceCampaignStatus;
  core_objective: UceCampaignObjective | null;
  product_count: number;
  brief_count: number;
  prospects_count: number;
  applicants_count: number;
  active_collabs_count: number;
  total_spend_to_date: number;
  total_impressions: string;
  budget_pool: number;
  created_at: string;
  updated_at: string;
};

export type CampaignShellProduct = {
  product_id: string;
  sku_code: string;
  product_name: string;
  inventory_count: number;
  out_of_stock: boolean;
  cost_per_unit: number;
  image_url: string | null;
};

export type CampaignShellBrief = {
  brief_id: string;
  internal_title: string;
  creative_guidelines: string;
  required_platforms: string[];
  deliverable_format_tags: string[];
  created_at: string;
};

export type CampaignShellTargeting = {
  industry_vertical: string;
  creator_archetypes: string[];
  follower_tiers: string[];
  audience_age_min: number;
  audience_age_max: number;
  audience_gender: string;
  target_locations: string[];
  disqualifying_keywords: string[];
};

export type CampaignShellCommercials = {
  compensation_type: string;
  fixed_fee_amount: number;
  negotiable_min_fee: number;
  negotiable_max_fee: number;
  total_campaign_budget_pool: number;
  advance_payment_percentage: number;
  final_balance_terms: string;
};

export type CampaignShellResponse = {
  campaign_id: string;
  campaign_name: string;
  current_status: UceCampaignStatus;
  can_edit_essentials: boolean;
  total_inventory_allocated: number;
  pause_warning: string | null;
  zone_1_master: {
    timeline_type: string;
    fixed_start_date: string | null;
    fixed_end_date: string | null;
    dynamic_days_limit: number | null;
    core_objective: UceCampaignObjective;
    platform_deliverables: unknown;
    budget_pool: number;
  } | null;
  zone_1_targeting: CampaignShellTargeting | null;
  zone_1_commercials: CampaignShellCommercials | null;
  zone_2_tactics: {
    products: CampaignShellProduct[];
    briefs: CampaignShellBrief[];
  };
  performance_aggregate: {
    total_spend_to_date: number;
    total_prospects_count: number;
    total_applicants_count: number;
    total_active_collabs_count: number;
  } | null;
  activation_checklist: Array<{
    key: string;
    label: string;
    satisfied: boolean;
  }>;
};

export type CampaignProductRecord = {
  product_id: string;
  campaign_id: string;
  sku_code: string;
  product_name: string;
  inventory_count: number;
  out_of_stock: boolean;
  cost_per_unit: number;
  image_url: string | null;
  created_at: string;
};

export type CreateCampaignProductBody = {
  sku_code: string;
  product_name: string;
  inventory_count: number;
  cost_per_unit: number;
  image_url?: string | null;
};

export type PatchCampaignEssentialsBody = {
  campaign_name?: string;
  budget_pool?: number;
  product_inventories?: Array<{
    product_id: string;
    inventory_count: number;
  }>;
};

export type UpdateCampaignProductBody = {
  inventory_count?: number;
  sku_code?: string;
  product_name?: string;
  cost_per_unit?: number;
  image_url?: string | null;
};

export type CampaignBriefRecord = {
  brief_id: string;
  campaign_id: string;
  internal_title: string;
  creative_guidelines: string;
  required_platforms: string[];
  deliverable_format_tags: string[];
  created_at: string;
};

export type CreateCampaignBriefBody = {
  internal_title: string;
  creative_guidelines: string;
  required_platforms: ("INSTAGRAM" | "TIKTOK" | "YOUTUBE")[];
  deliverable_format_tags: string[];
};

export type PipelineCollaborationRow = {
  collaboration_id: string;
  /** Workflow thread id (`collaborations.id`) after brand approves applicant. */
  workflow_collaboration_id: string | null;
  campaign_id: string;
  brief_id: string;
  brief_internal_title: string;
  product_id: string | null;
  product_sku_name: string | null;
  instagram_handle: string;
  creator_email: string;
  match_score: number;
  vetting_remark: string | null;
  rejection_reason: string | null;
  collab_status: string;
  current_milestone: string;
  pipeline_health: string;
  negotiation_state: string | null;
  securement_state: string | null;
  logistics_state: string | null;
  review_state: string | null;
  publishing_state: string | null;
  negotiation_round_count: number;
  fulfillment_issue_count: number;
  revision_round_count: number;
  total_quote: number;
  advance_30_value: number;
  balance_70_value: number;
  logistics_carrier: string | null;
  logistics_tracking_number: string | null;
  content_draft_url: string | null;
  live_published_url: string | null;
  compliance_verified: boolean;
  auto_approval_deadline_72h: string | null;
  current_milestone_deadline: string;
  calculated_hours_remaining_review: number | null;
  calculated_days_overdue: number | null;
};

export type PipelineListResponse = {
  overview: {
    total: number;
    mean_match_score: number;
  };
  rows: PipelineCollaborationRow[];
};

export type CampaignReportingResponse = {
  campaign_id: string;
  campaign_name: string;
  primary_objective: UceCampaignObjective;
  last_api_sync_timestamp: string;
  elapsed_time_string: string;
  roi_summary_strip_payload: Record<string, number>;
  timeseries_hourly_feed: Array<{
    recorded_hour: string;
    hourly_likes_count: number;
    hourly_comments_count: number;
    hourly_saves_count: number;
    hourly_shares_count: number;
    hourly_impressions_delta: number;
  }>;
  leaderboard_rankings: Array<{
    rank_position: number;
    collaboration_id: string;
    instagram_handle: string;
    assigned_fee_investment: number;
    delivered_impressions_count: number;
    cost_per_engagement_value: number;
    roi_performance_index_score: number;
  }>;
  creative_gallery_grid: Array<{
    asset_id: string;
    collaboration_id: string;
    instagram_handle: string;
    platform: string;
    media_thumbnail_url: string | null;
    high_res_source_download_url: string | null;
    engagement_rate_percentage: number;
    saves_count: number;
    shares_count: number;
    story_sticker_clicks_count: number;
    spark_ad_authorization_code: string | null;
    is_whitelisting_active: boolean;
  }>;
};

export type PatchCampaignStatusResponse = {
  campaign_id: string;
  current_status: UceCampaignStatus;
  pause_warning: string | null;
};
