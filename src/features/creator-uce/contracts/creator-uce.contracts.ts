export type CreatorOpenCampaignBrief = {
  brief_id: string;
  internal_title: string;
  creative_guidelines: string;
  required_platforms: string[];
  deliverable_format_tags: string[];
};

export type CreatorOpenCampaignProduct = {
  product_id: string;
  sku_code: string;
  product_name: string;
  inventory_count: number;
  out_of_stock: boolean;
};

export type CreatorOpenCampaignRow = {
  campaign_id: string;
  campaign_name: string;
  brand_name: string;
  core_objective: string | null;
  already_applied: boolean;
  briefs: CreatorOpenCampaignBrief[];
  products: CreatorOpenCampaignProduct[];
};

export type CreatorApplyResponse = {
  collaboration_id: string;
  campaign_id: string;
  collab_status: string;
  match_score: number;
};
