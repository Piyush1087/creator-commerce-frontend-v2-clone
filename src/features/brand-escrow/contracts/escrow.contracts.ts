import { z } from "zod";

export const TREASURY_ROLES = [
  "BRAND_OWNER",
  "FINANCE_ADMIN",
  "CAMPAIGN_MANAGER",
] as const;

export const BRAND_RETURN_STATUSES = [
  "RETURN_REQUESTED",
  "ALLOCATING_SOURCES",
  "PROCESSING",
  "COMPLETED",
  "PARTIAL",
  "ACTION_REQUIRED",
  "FAILED",
] as const;

export const BRAND_RETURN_ACTION_REASONS = [
  "SOURCE_PROVENANCE_REQUIRED",
  "PROVIDER_SETUP_REQUIRED",
  "PROVIDER_OUTCOME_AMBIGUOUS",
  "SOURCE_NO_LONGER_REFUNDABLE",
  "PROVIDER_RECONCILIATION_REQUIRED",
  "UNSUPPORTED_SOURCE",
  "UNSUPPORTED_CURRENCY",
] as const;

const fundingTransactionTypes = [
  "LOAD",
  "LOAD_FEE",
  "RESERVE",
  "RELEASE",
  "CREATOR_PAYOUT",
  "PLATFORM_COMMISSION",
  "GST",
  "COLLAB_REFUND",
  "BRAND_RETURN",
  "REVERSAL_CORRECTION",
  "VBA_TOPUP_WIRE",
  "GATEWAY_TOPUP_CARD",
  "CONTRACT_LOCK_RESERVE",
  "TRANCHE_ADVANCE_RELEASE",
  "TRANCHE_FINAL_RELEASE",
  "PLATFORM_FEE_CAPTURE",
  "TDS_BUFFER_REVERSAL",
  "FAILED_COLLAB_REFUND",
  "CREATOR_PAYOUT_SETTLEMENT",
  "CREATOR_PAYOUT_REVERSAL",
] as const;

const transactionStatuses = [
  "PENDING",
  "CREDITED",
  "PROCESSING_GATEWAY",
  "CLEARED",
  "FAILED",
  "REVERSED",
] as const;

const allocationStates = [
  "READY",
  "PROCESSING",
  "SUCCEEDED",
  "FAILED_TERMINAL",
  "ACTION_REQUIRED",
  "RELEASED",
] as const;

const money = z.number().finite().nonnegative();
const currency = z.string().regex(/^[A-Z]{3}$/);
const isoDate = z.string().datetime({ offset: true });
const nullableProviderValue = z.string().min(1).nullable();

export const escrowVaultSchema = z
  .object({
    vault_id: z.string().uuid(),
    brand_id: z.string().uuid(),
    razorpay_virtual_account_id: nullableProviderValue,
    virtual_account_number: nullableProviderValue,
    ifsc_code: nullableProviderValue,
    upi_vpa: nullableProviderValue,
    bank_name: nullableProviderValue,
    virtual_account_enabled: z.boolean(),
    currency,
    total_pooled_balance: money,
    locked_campaign_funds: money,
    available_balance: money,
    active_return_commitment: money,
    tds_buffer_balance: money,
    pending_funding: money,
    created_at: isoDate,
    updated_at: isoDate,
  })
  .strict();

export const escrowLedgerEntrySchema = z
  .object({
    transaction_id: z.string().uuid(),
    transaction_type: z.enum(fundingTransactionTypes),
    payout_tranche_target: z.string().nullable(),
    amount: money,
    currency,
    gateway_processing_surcharge: money,
    gateway_surcharge_gst: money,
    transaction_status: z.enum(transactionStatuses),
    collaboration_id: z.string().uuid().nullable(),
    gateway_reference_id: z.string().nullable(),
    created_at: isoDate,
  })
  .strict();

export const escrowTopUpIntentSchema = z
  .object({
    checkout_order_id: z.string().min(1),
    funding_load_id: z.string().uuid(),
    total_invoice_charge_amount: money,
    allocation_amount: money,
    gateway_surcharge: money,
    surcharge_gst: money,
  })
  .strict();

export const brandReturnSummarySchema = z
  .object({
    available_balance: money,
    proven_source_available_balance: money,
    self_service_returnable_balance: money,
    active_return_commitment: money,
    source_reconciliation_required_amount: money,
    currency: currency.nullable(),
  })
  .strict();

const brandReturnAllocationSchema = z
  .object({
    allocation_id: z.string().uuid(),
    amount: money,
    currency,
    state: z.enum(allocationStates),
    action_required_reason: z.enum(BRAND_RETURN_ACTION_REASONS).nullable(),
    attempt_count: z.number().int().nonnegative(),
    created_at: isoDate,
    updated_at: isoDate,
  })
  .strict();

export const brandReturnRequestSchema = z
  .object({
    brand_return_request_id: z.string().uuid(),
    idempotency_identity: z.string().uuid(),
    requested_amount: money,
    committed_amount: money,
    successful_amount: money,
    unresolved_amount: money,
    released_amount: money,
    currency,
    status: z.enum(BRAND_RETURN_STATUSES),
    action_required_reason: z.enum(BRAND_RETURN_ACTION_REASONS).nullable(),
    allocation_count: z.number().int().nonnegative(),
    allocations: z.array(brandReturnAllocationSchema),
    requested_at: isoDate,
    processing_at: isoDate.nullable(),
    completed_at: isoDate.nullable(),
    updated_at: isoDate,
  })
  .strict();

export const treasuryRoleSchema = z
  .object({ current_user_role: z.enum(TREASURY_ROLES) })
  .passthrough();

export type TreasuryRole = (typeof TREASURY_ROLES)[number];
export type BrandReturnStatus = (typeof BRAND_RETURN_STATUSES)[number];
export type BrandReturnActionReason =
  (typeof BRAND_RETURN_ACTION_REASONS)[number];
export type EscrowVaultApiResponse = z.infer<typeof escrowVaultSchema>;
export type EscrowLedgerApiEntry = z.infer<typeof escrowLedgerEntrySchema>;
export type EscrowTopUpIntentApiResponse = z.infer<
  typeof escrowTopUpIntentSchema
>;
export type BrandReturnSummaryApiResponse = z.infer<
  typeof brandReturnSummarySchema
>;
export type BrandReturnRequestApiResponse = z.infer<
  typeof brandReturnRequestSchema
>;

export function canMutateTreasury(role: TreasuryRole | null): boolean {
  return role === "BRAND_OWNER" || role === "FINANCE_ADMIN";
}
