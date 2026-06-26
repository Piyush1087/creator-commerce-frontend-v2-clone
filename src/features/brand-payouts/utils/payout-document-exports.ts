import {
  downloadTextFile,
  exportPrintableDocument,
} from "../../../shared/documents/export-printable-document";
import type {
  BrandDisbursalRow,
  BrandEscrowLockRow,
  BrandPayoutsLedgerRow,
} from "../contracts/brand-payouts.contracts";

function tableHtml(headers: string[], rows: string[][]): string {
  const head = headers.map((cell) => `<th>${cell}</th>`).join("");
  const body = rows
    .map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`)
    .join("");
  return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

export function exportMonthlyEscrowStatementPdf(
  ledger: BrandPayoutsLedgerRow[],
  brandName: string,
): void {
  const rows = ledger.map((entry) => [
    entry.created_at,
    entry.transaction_id,
    entry.transaction_type,
    entry.creator_handle ?? entry.campaign_name ?? "-",
    `${entry.currency} ${entry.amount.toFixed(2)}`,
    entry.transaction_status,
  ]);
  exportPrintableDocument({
    title: `Monthly Consolidated Escrow Statement — ${brandName}`,
    bodyHtml: `<p class="meta">Generated ${new Date().toLocaleString()}</p>${tableHtml(
      ["Date", "Transaction ID", "Type", "Context", "Amount", "Status"],
      rows,
    )}`,
    filename: "escrow-statement.pdf",
  });
}

export function exportPlatformFeeGstInvoicePdf(
  ledger: BrandPayoutsLedgerRow[],
  brandName: string,
): void {
  const feeRows = ledger.filter((entry) => entry.transaction_type === "PLATFORM_FEE_CAPTURE");
  const rows = feeRows.map((entry) => [
    entry.created_at,
    entry.transaction_id,
    `${entry.currency} ${entry.amount.toFixed(2)}`,
    entry.transaction_status,
  ]);
  exportPrintableDocument({
    title: `Platform Service Fee GST Invoice — ${brandName}`,
    bodyHtml: `<p class="meta">Tax input credit summary for platform service fees.</p>${tableHtml(
      ["Date", "Invoice ref", "GST amount", "Status"],
      rows.length > 0 ? rows : [["—", "—", "—", "No fee captures in period"]],
    )}`,
    filename: "gst-invoice.pdf",
  });
}

export function exportTdsLedgerFolder(
  locks: BrandEscrowLockRow[],
  ledger: BrandPayoutsLedgerRow[],
): void {
  const lockCsv = [
    "Lock ID,Campaign,Creator,Gross,TDS Buffer,Total Hold",
    ...locks.map(
      (row) =>
        `${row.lock_id},${row.campaign_name},${row.creator_handle},${row.gross_base_quote},${row.tds_buffer_pool},${row.total_hold_value}`,
    ),
  ].join("\n");

  const ledgerCsv = [
    "Date,Transaction ID,Type,Amount,Status",
    ...ledger.map(
      (row) =>
        `${row.created_at},${row.transaction_id},${row.transaction_type},${row.amount},${row.transaction_status}`,
    ),
  ].join("\n");

  downloadTextFile("quarterly-tds-locks.csv", lockCsv, "text/csv");
  downloadTextFile("quarterly-tds-ledger.csv", ledgerCsv, "text/csv");
}

export function exportClearingReceiptPdf(row: BrandDisbursalRow, brandName: string): void {
  exportPrintableDocument({
    title: "Razorpay Clearing Receipt",
    bodyHtml: `
      <p class="meta">${brandName}</p>
      <p><strong>Disbursal ID:</strong> ${row.disbursal_id}</p>
      <p><strong>Recipient:</strong> ${row.recipient_creator ?? "—"}</p>
      <p><strong>Campaign:</strong> ${row.campaign_name ?? "—"}</p>
      <p><strong>Tranche:</strong> ${row.tranche_phase ?? "—"}</p>
      <p><strong>Net settled:</strong> ${row.net_settled_amount.toFixed(2)}</p>
      <p><strong>Clearing reference:</strong> ${row.razorpay_clearing_reference ?? "—"}</p>
      <p><strong>Cleared at:</strong> ${row.cleared_at}</p>
    `,
    filename: `clearing-receipt-${row.disbursal_id}.pdf`,
  });
}
