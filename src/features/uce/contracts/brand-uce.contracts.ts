export type UceCampaignStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "COMPLETED" | "ARCHIVED";

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

export type UceCampaignAssetType =
  | "INDIVIDUAL_PRODUCT_SKU"
  | "CURATED_COLLECTION_LINE"
  | "CORE_BRAND_IDENTITY"
  | "ACTIVE_SALE_PROMOTION";

export type UceBriefStrategyMode = "CREATOR_LED" | "BRAND_LED";

export type CampaignShellProduct = {
  product_id: string;
  asset_type?: UceCampaignAssetType;
  sku_code: string | null;
  product_name: string;
  inventory_count: number;
  out_of_stock: boolean;
  cost_per_unit: number;
  image_url: string | null;
  asset_payload?: unknown;
};

export type CampaignShellBrief = {
  brief_id: string;
  product_id?: string | null;
  internal_title: string;
  creative_guidelines: string;
  required_platforms: string[];
  deliverable_format_tags: string[];
  brief_type?: UceBriefStrategyMode | null;
  purpose?: string | null;
  objective?: string | null;
  target_influencer_archetype?: string | null;
  mandatory_creator_requirements?: string | null;
  deliverables_inventory?: unknown;
  content_guidance_matrix?: unknown;
  parent_planner_logistics_snapshot?: unknown;
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
  campaign_assets: CampaignAssetProjection[];
  reconciliation: {
    required: boolean;
    title: string | null;
    message: string | null;
  };
  capabilities: {
    can_select_campaign_asset: boolean;
    can_execute_campaign: boolean;
    legacy_products_read_only: boolean;
    can_create_canonical_brief: boolean;
    legacy_briefs_read_only: boolean;
  };
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
    canonical_briefs: CanonicalCampaignBrief[];
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

export type CanonicalBriefDeliverable = {
  deliverable_id: string;
  format: string;
  quantity: number;
  creative_requirements: string;
  publishing_required: boolean;
};

export type CanonicalCampaignBrief = {
  brief_id: string;
  campaign_asset_id: string;
  title: string;
  creative_requirements: string;
  is_active: boolean;
  deliverables: CanonicalBriefDeliverable[];
  readiness: { ready: boolean; missing_requirements: string[] };
  created_at: string;
};

export type CreateCanonicalCampaignBriefBody = {
  campaign_asset_id: string;
  title: string;
  creative_requirements: string;
  deliverables: Array<{
    format: string;
    quantity: number;
    creative_requirements: string;
    publishing_required: boolean;
  }>;
};

export type CampaignDiscoveryProjection = {
  availability: "UNAVAILABLE";
  message: string;
  recommendations: [];
};

export type CampaignApplicationProjection = {
  application_id: string;
  status: "SUBMITTED" | "ACCEPTED" | "REJECTED";
  creator: { creator_user_id: string; name: string | null; email: string };
  brief: { brief_id: string; title: string };
  collaboration_reference: { collaboration_id: string } | null;
  created_at: string;
};

export type CampaignAssetKind = "BRAND" | "OFFERING" | "OFFER";

export type CampaignAssetProjection = {
  campaign_asset_id: string;
  kind: CampaignAssetKind;
  status: "ACTIVE" | "PAUSED";
  entity_id: string;
  label: string;
  subtype: string | null;
  image_url: string | null;
};

export type SelectableCampaignAsset = {
  kind: CampaignAssetKind;
  entity_id: string;
  label: string;
  subtype: string | null;
  image_url: string | null;
};

export type CampaignProductRecord = {
  product_id: string;
  campaign_id: string;
  asset_type?: UceCampaignAssetType;
  sku_code: string | null;
  product_name: string;
  inventory_count: number;
  out_of_stock: boolean;
  cost_per_unit: number;
  image_url: string | null;
  asset_payload?: unknown;
  created_at: string;
};

export type PromotionApplicability =
  | "SITEWIDE"
  | "SPECIFIC_PRODUCT"
  | "SPECIFIC_COLLECTION";

export type CreateCampaignProductBody =
  | {
      asset_type: "INDIVIDUAL_PRODUCT_SKU";
      campaign_id: string;
      product_name: string;
      price: number;
      pdp_url: string;
      thumbnail_asset_url: string | null;
      brief_description: string;
      unique_selling_points: string[];
      compliance_do_not_say_tokens: string[];
      is_sync_locked?: boolean;
    }
  | {
      asset_type: "CURATED_COLLECTION_LINE";
      campaign_id: string;
      collection_name: string;
      collection_pdp_url: string;
      collection_thumbnail_url: string | null;
      short_description: string;
      collection_usps: string[];
      linked_product_ids: string[];
    }
  | {
      asset_type: "CORE_BRAND_IDENTITY";
      campaign_id: string;
      brand_id: string;
      corporate_legal_name: string;
      brand_mission_statement: string;
      global_tone_adjectives: string[];
    }
  | {
      asset_type: "ACTIVE_SALE_PROMOTION";
      campaign_id: string;
      offer_name: string;
      brief_description: string;
      offer_code: string;
      applicability: PromotionApplicability;
      target_linked_entity_id: string | null;
      start_date_iso: string;
      expiration_date_iso: string;
      t_and_c_footnote: string;
      entity_deep_link_url: string;
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
  product_id?: string | null;
  internal_title: string;
  creative_guidelines: string;
  required_platforms: string[];
  deliverable_format_tags: string[];
  brief_type?: UceBriefStrategyMode | null;
  purpose?: string | null;
  objective?: string | null;
  target_influencer_archetype?: string | null;
  mandatory_creator_requirements?: string | null;
  deliverables_inventory?: unknown;
  content_guidance_matrix?: unknown;
  parent_planner_logistics_snapshot?: unknown;
  created_at: string;
};

export type DeliverableFormatType =
  | "REEL_VIDEO"
  | "STORY"
  | "PHOTOSHOOT"
  | "CAROUSEL_BANNER";

export type CreateCampaignBriefDeliverable = {
  format_type: DeliverableFormatType;
  video_aspect_ratio?: "9_16_VERTICAL" | "4_5_PORTRAIT";
  video_duration_range?: "UNDER_15S" | "15_45S" | "OVER_45S";
  is_reel_amplification?: boolean;
  photoshoot_quantity_allocation?: number;
  carousel_aspect_ratio?: "4_5_PORTRAIT" | "1_1_SQUARE";
  carousel_max_slide_count?: number;
};

export type CreateCampaignBriefGuidance = {
  deliverable_id: string;
  format_type: DeliverableFormatType;
  is_reel_amplification?: boolean;
  creator_led_details?: {
    content_theme: string;
    description: string;
    hook_ideas: string[];
    recommended_b_rolls: string;
    creator_dos: string[];
    creator_donts: string[];
    audio_strategy:
      | "DIRECT_VOICEOVER"
      | "TRENDING_MUSIC_BACKGROUND"
      | "LOFI_FOCUS_BEATS"
      | "ORIGINAL_AUDIO";
    lighting_requirements:
      | "NATURAL_DAYLIGHT"
      | "BRIGHT_CLINICAL"
      | "WARM_MOODY"
      | "STUDIO_RING_LIGHT";
    background_setting: string;
    tone_of_voice:
      | "AUTHORITATIVE_EXPERT"
      | "HIGH_ENERGY"
      | "CALMING_ASMR"
      | "RELATABLE_CASUAL";
    post_caption: string;
    hashtags_and_mentions: string[];
  };
  brand_led_storyboard?: Array<{
    sequence_index_id: number;
    segment_type:
      | "HOOK_OPENER"
      | "PROBLEM_PITCH"
      | "ACTIVE_TECH_REVIEW"
      | "CONVERSION_CTA";
    visual_direction: string;
    audio_teleprompter_script: string;
    target_screen_time_seconds: number;
    reference_frame_asset_url?: string | null;
  }>;
};

export type CreateCampaignBriefBody = {
  campaign_id: string;
  product_id: string;
  brief_name: string;
  purpose: string;
  objective: string;
  target_influencer_archetype: string;
  brief_type: UceBriefStrategyMode;
  mandatory_creator_requirements: string;
  deliverables_inventory: CreateCampaignBriefDeliverable[];
  content_guidance_matrix: CreateCampaignBriefGuidance[];
  parent_planner_logistics_snapshot: {
    campaign_fulfillment_deadline_descriptor: string;
    fixed_calendar_target_date: string;
    is_physical_product_gifting_required: boolean;
    base_escrow_compensation_payout_float: number;
    commission_incentive_percentage_float: number;
    link_in_bio_duration_days: number;
    paid_ads_boosting_whitelist_duration_days: number;
    organic_reposting_license_duration_days: number;
  };
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
