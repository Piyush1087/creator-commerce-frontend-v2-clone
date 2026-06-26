import type { EscrowLedgerEntry } from "../../brand-escrow/types";
import { displayCurrency } from "../../brand-escrow/utils/display-value";

function csvCell(value: string): string {
  const escaped = value.replace(/"/g, '""');
  return `"${escaped}"`;
}

export function downloadLedgerCsv(entries: EscrowLedgerEntry[], filename = "payouts-ledger.csv"): void {
  const header = [
    "Date",
    "Transaction ID",
    "Type",
    "Label",
    "Amount",
    "Currency",
    "Status",
    "Collaboration ID",
    "Gateway Reference",
  ];
  const rows = entries.map((entry) =>
    [
      entry.occurredAt,
      entry.id,
      entry.transactionType,
      entry.label,
      String(entry.amount),
      entry.currency,
      entry.status ?? "",
      entry.collaborationId ?? "",
      entry.gatewayReferenceId ?? "",
    ]
      .map(csvCell)
      .join(","),
  );
  const csv = [header.map(csvCell).join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function formatLedgerAmount(entry: EscrowLedgerEntry): string {
  return displayCurrency(entry.amount, entry.currency);
}
