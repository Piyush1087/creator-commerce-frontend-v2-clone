export type CreatorBankMethodStatus = "none" | "verified" | "suspended";

export type CreatorPayoutsSummary = {
  currency: string;
  total_escrow_balance: number;
  processing_balance: number;
  lifetime_cleared_balance: number;
  active_campaign_count: number;
  next_payout_date: string | null;
  account_creation_year: number;
};

export type CreatorBankMethod = {
  status: CreatorBankMethodStatus;
  bank_name: string | null;
  account_last_4: string | null;
  account_holder: string | null;
};

export type CreatorFeeBreakdown = {
  gross_quote: number;
  platform_fee: number;
  net_payout: number;
};

export type CreatorEscrowPipelineRow = {
  collaboration_id: string;
  brand_name: string;
  campaign_name: string;
  amount_locked: number;
  milestone_status: string;
  escrow_status: string | null;
  fee_breakdown: CreatorFeeBreakdown;
};

export type CreatorClearedPayoutRow = {
  cleared_at: string;
  collaboration_id: string;
  brand_name: string;
  campaign_name: string;
  net_payout: number;
  status: string;
  transaction_id: string | null;
  tranche: string | null;
  fee_breakdown: CreatorFeeBreakdown;
};

export type CreatorPayoutsHubResponse = {
  summary: CreatorPayoutsSummary;
  bank_method: CreatorBankMethod;
  escrow_pipeline: CreatorEscrowPipelineRow[];
  cleared_payouts: CreatorClearedPayoutRow[];
  counts: {
    escrow_pipeline: number;
    cleared_payouts: number;
  };
};

export type CreatorPayoutsLedgerTab = "escrow" | "cleared" | "invoices";
