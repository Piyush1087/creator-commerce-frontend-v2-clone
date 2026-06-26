import type { EscrowLedgerEntry } from "../../brand-escrow/types";

export type PayoutsLedgerTab = "all" | "locks" | "disbursals" | "invoices";

const LOCK_TYPES = new Set(["CONTRACT_LOCK_RESERVE"]);
const DISBURSAL_TYPES = new Set([
  "TRANCHE_ADVANCE_RELEASE",
  "TRANCHE_FINAL_RELEASE",
  "PLATFORM_FEE_CAPTURE",
]);

export function filterLedgerForTab(
  entries: EscrowLedgerEntry[],
  tab: PayoutsLedgerTab,
): EscrowLedgerEntry[] {
  if (tab === "locks") {
    return entries.filter((entry) => LOCK_TYPES.has(entry.transactionType));
  }
  if (tab === "disbursals") {
    return entries.filter((entry) => DISBURSAL_TYPES.has(entry.transactionType));
  }
  if (tab === "invoices") {
    return [];
  }
  return entries;
}

export function ledgerTabLabel(tab: PayoutsLedgerTab): string {
  switch (tab) {
    case "all":
      return "All Capital Movements";
    case "locks":
      return "Active Escrow Locks";
    case "disbursals":
      return "Cleared Payout Disbursals";
    case "invoices":
      return "Invoices & Tax Corner";
    default:
      return tab;
  }
}
