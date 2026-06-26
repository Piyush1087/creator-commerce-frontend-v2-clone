export type EscrowVaultApiResponse = {
  vault_id: string;
  brand_id: string;
  razorpay_virtual_account_id: string;
  virtual_account_number: string;
  ifsc_code: string;
  upi_vpa: string | null;
  bank_name: string;
  currency: string;
  total_pooled_balance: number;
  locked_campaign_funds: number;
  available_balance: number;
  tds_buffer_balance: number;
  created_at: string;
  updated_at: string;
};

export type EscrowLedgerApiEntry = {
  transaction_id: string;
  transaction_type: string;
  payout_tranche_target: string | null;
  amount: number;
  currency: string;
  gateway_processing_surcharge: number;
  gateway_surcharge_gst: number;
  transaction_status: string;
  collaboration_id: string | null;
  gateway_reference_id: string | null;
  created_at: string;
};

export type EscrowTopUpIntentApiResponse = {
  checkout_order_id: string;
  internal_transaction_id: string;
  total_invoice_charge_amount: number;
  allocation_amount: number;
  gateway_surcharge: number;
  surcharge_gst: number;
};

export type EscrowBreakdownApiResponse = {
  gross_creator_quote: number;
  platform_commission_fee: number;
  platform_commission_gst: number;
  total_escrow_locked_amount: number;
  calculated_tds_deduction: number;
  net_creator_payout_pool: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isEscrowVaultApiResponse(value: unknown): value is EscrowVaultApiResponse {
  return (
    isRecord(value) &&
    typeof value.vault_id === "string" &&
    typeof value.currency === "string" &&
    typeof value.available_balance === "number"
  );
}

export function isEscrowLedgerApiEntry(value: unknown): value is EscrowLedgerApiEntry {
  return (
    isRecord(value) &&
    typeof value.transaction_id === "string" &&
    typeof value.transaction_type === "string" &&
    typeof value.amount === "number"
  );
}

export function isEscrowLedgerApiResponse(value: unknown): value is EscrowLedgerApiEntry[] {
  return Array.isArray(value) && value.every(isEscrowLedgerApiEntry);
}

export function isEscrowTopUpIntentApiResponse(
  value: unknown,
): value is EscrowTopUpIntentApiResponse {
  return (
    isRecord(value) &&
    typeof value.checkout_order_id === "string" &&
    typeof value.internal_transaction_id === "string"
  );
}

export function isEscrowBreakdownApiResponse(
  value: unknown,
): value is EscrowBreakdownApiResponse {
  return (
    isRecord(value) &&
    typeof value.total_escrow_locked_amount === "number" &&
    typeof value.net_creator_payout_pool === "number"
  );
}
