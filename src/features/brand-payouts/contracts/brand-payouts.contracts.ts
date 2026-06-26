import type { EscrowVaultApiResponse } from "../../brand-escrow/contracts/escrow.contracts";

export type BrandPayoutsWorkspaceRole = "CAMPAIGN_MANAGER" | "FINANCE_ADMIN";

export type BrandPayoutsFunding = {
  account_name: string;
  corporate_account_number: string;
  ifsc_code: string;
  upi_vpa: string;
  bank_partner: string;
  razorpay_virtual_account_id: string;
};

export type BrandPayoutsLedgerRow = {
  transaction_id: string;
  transaction_type: string;
  payout_tranche_target: string | null;
  amount: number;
  currency: string;
  transaction_status: string;
  collaboration_id: string | null;
  campaign_id: string | null;
  campaign_name: string | null;
  creator_handle: string | null;
  gateway_reference_id: string | null;
  created_at: string;
};

export type BrandEscrowLockRow = {
  lock_id: string;
  collaboration_id: string;
  campaign_id: string;
  creator_handle: string;
  campaign_name: string;
  gross_base_quote: number;
  platform_commission: number;
  platform_commission_gst: number;
  tds_buffer_pool: number;
  total_hold_value: number;
  current_stage: string;
};

export type BrandDisbursalRow = {
  disbursal_id: string;
  collaboration_id: string | null;
  recipient_creator: string | null;
  campaign_name: string | null;
  tranche_phase: string | null;
  net_settled_amount: number;
  razorpay_clearing_reference: string | null;
  cleared_at: string;
  transaction_status: string;
};

export type BrandPayoutsHubResponse = {
  workspace_role: BrandPayoutsWorkspaceRole;
  vault_missing: boolean;
  vault: EscrowVaultApiResponse | null;
  brand_corporate_name: string;
  summary: {
    active_campaign_count: number;
    stalled_allocations_count: number;
  };
  funding: BrandPayoutsFunding | null;
  ledger: BrandPayoutsLedgerRow[];
  escrow_locks: BrandEscrowLockRow[];
  disbursals: BrandDisbursalRow[];
};
