import type { EscrowLedgerEntry } from "../../brand-escrow/types";
import type { BrandPayoutsLedgerRow } from "../contracts/brand-payouts.contracts";

const CREDIT_TYPES = new Set([
  "VBA_TOPUP_WIRE",
  "GATEWAY_TOPUP_CARD",
  "TDS_BUFFER_REVERSAL",
  "FAILED_COLLAB_REFUND",
]);

const TYPE_LABELS: Record<string, string> = {
  VBA_TOPUP_WIRE: "Bank wire top-up",
  GATEWAY_TOPUP_CARD: "Card top-up",
  CONTRACT_LOCK_RESERVE: "Contract lock reserve",
  TRANCHE_ADVANCE_RELEASE: "Advance payout (30%)",
  TRANCHE_FINAL_RELEASE: "Final payout (70%)",
  PLATFORM_FEE_CAPTURE: "Platform fee capture",
  TDS_BUFFER_REVERSAL: "TDS returned to balance",
  FAILED_COLLAB_REFUND: "Collaboration refund",
};

export function mapHubLedgerRow(entry: BrandPayoutsLedgerRow): EscrowLedgerEntry {
  const direction: EscrowLedgerEntry["direction"] = CREDIT_TYPES.has(entry.transaction_type)
    ? "credit"
    : "debit";

  const contextLabel =
    entry.creator_handle && entry.campaign_name
      ? `${entry.creator_handle} / ${entry.campaign_name}`
      : entry.campaign_name ?? entry.creator_handle ?? TYPE_LABELS[entry.transaction_type] ?? entry.transaction_type;

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
    contextLabel,
  };
}

export function maskSensitiveAccount(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 4) {
    return `•••• ${digits}`;
  }
  return `•••• ${digits.slice(-4)}`;
}
