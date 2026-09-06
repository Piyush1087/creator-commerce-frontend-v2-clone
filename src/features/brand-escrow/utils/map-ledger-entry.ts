import type { EscrowLedgerApiEntry } from "../contracts/escrow.contracts";
import type { EscrowLedgerEntry } from "../types";

const CREDIT_TYPES = new Set([
  "LOAD",
  "RELEASE",
  "VBA_TOPUP_WIRE",
  "GATEWAY_TOPUP_CARD",
  "TDS_BUFFER_REVERSAL",
  "FAILED_COLLAB_REFUND",
  "COLLAB_REFUND",
  "CREATOR_PAYOUT_REVERSAL",
]);

const TYPE_LABELS: Record<string, string> = {
  LOAD: "Funding load",
  LOAD_FEE: "Funding fee",
  RESERVE: "Collaboration reserve",
  RELEASE: "Released commitment",
  CREATOR_PAYOUT: "Creator payout execution",
  PLATFORM_COMMISSION: "Platform commission",
  GST: "Tax on platform fee",
  COLLAB_REFUND: "Collaboration funds released",
  BRAND_RETURN: "External Brand Return",
  REVERSAL_CORRECTION: "Provider reversal correction",
  VBA_TOPUP_WIRE: "Bank wire top-up",
  GATEWAY_TOPUP_CARD: "Card top-up",
  CONTRACT_LOCK_RESERVE: "Contract lock reserve",
  TRANCHE_ADVANCE_RELEASE: "Advance payout (30%)",
  TRANCHE_FINAL_RELEASE: "Final payout (70%)",
  PLATFORM_FEE_CAPTURE: "Platform fee capture",
  TDS_BUFFER_REVERSAL: "TDS returned to balance",
  FAILED_COLLAB_REFUND: "Collaboration refund",
};

export function mapLedgerApiEntry(entry: EscrowLedgerApiEntry): EscrowLedgerEntry {
  const direction: EscrowLedgerEntry["direction"] = CREDIT_TYPES.has(entry.transaction_type)
    ? "credit"
    : "debit";

  return {
    id: entry.transaction_id,
    label: TYPE_LABELS[entry.transaction_type] ?? entry.transaction_type,
    transactionType: entry.transaction_type,
    occurredAt: entry.created_at,
    amount: entry.amount,
    currency: entry.currency,
    direction,
    status: entry.transaction_status,
    collaborationId: entry.collaboration_id,
    gatewayReferenceId: entry.gateway_reference_id,
    trancheTarget: entry.payout_tranche_target,
  };
}
