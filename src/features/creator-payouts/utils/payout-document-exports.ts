import { exportPrintableDocument } from "../../../shared/documents/export-printable-document";
import type {
  CreatorClearedPayoutRow,
  CreatorPayoutsHubResponse,
} from "../contracts/creator-payouts.contracts";

export function exportCreatorMonthlyStatementPdf(data: CreatorPayoutsHubResponse): void {
  const rows = data.cleared_payouts.map((row) => [
    row.cleared_at,
    `${row.brand_name} — ${row.campaign_name}`,
    row.net_payout.toFixed(2),
    row.status,
  ]);
  exportPrintableDocument({
    title: `Monthly Statement — ${new Date().toLocaleString("en-US", { month: "long", year: "numeric" })}`,
    bodyHtml: `<p class="meta">Creator earnings summary</p><table><thead><tr><th>Date</th><th>Brand / Campaign</th><th>Net</th><th>Status</th></tr></thead><tbody>${rows
      .map(
        (row) =>
          `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`,
      )
      .join("")}</tbody></table>`,
  });
}

export function exportCreatorAnnualTaxFormPdf(year: number, data: CreatorPayoutsHubResponse): void {
  const total = data.summary.lifetime_cleared_balance;
  exportPrintableDocument({
    title: `Annual Tax Form (1099-NEC / Form 16A) — ${year}`,
    bodyHtml: `
      <p class="meta">Annual withholding summary for tax filing.</p>
      <p><strong>Tax year:</strong> ${year}</p>
      <p><strong>Total cleared earnings:</strong> ${data.summary.currency} ${total.toFixed(2)}</p>
      <p><strong>Cleared payout events:</strong> ${data.counts.cleared_payouts}</p>
    `,
  });
}

export function exportCreatorClearedReceiptPdf(
  row: CreatorClearedPayoutRow,
  currency: string,
): void {
  exportPrintableDocument({
    title: "Payout receipt",
    bodyHtml: `
      <p><strong>Brand / campaign:</strong> ${row.brand_name} — ${row.campaign_name}</p>
      <p><strong>Gross quote:</strong> ${currency} ${row.fee_breakdown.gross_quote.toFixed(2)}</p>
      <p><strong>Platform fee:</strong> ${currency} ${row.fee_breakdown.platform_fee.toFixed(2)}</p>
      <p><strong>Net payout:</strong> ${currency} ${row.fee_breakdown.net_payout.toFixed(2)}</p>
      <p><strong>Status:</strong> ${row.status}</p>
      <p><strong>Cleared:</strong> ${row.cleared_at}</p>
      ${row.transaction_id ? `<p><strong>Transaction ID:</strong> ${row.transaction_id}</p>` : ""}
    `,
  });
}
