import type { EscrowVaultApiResponse } from "../contracts/escrow.contracts";
import { displayCurrency } from "../utils/display-value";

type EscrowBalanceMetricsProps = { vault: EscrowVaultApiResponse };

export function EscrowBalanceMetrics({ vault }: EscrowBalanceMetricsProps) {
  const metrics = [
    {
      label: "Available balance",
      value: vault.available_balance,
      hint: "Cleared, uncommitted vault money. Source eligibility may still limit external return.",
      accent: true,
    },
    {
      label: "Locked campaign funds",
      value: vault.locked_campaign_funds,
      hint: "Committed to Collaboration obligations; there is no Settings release control.",
    },
    {
      label: "Pending funding",
      value: vault.pending_funding,
      hint: "Not usable or returnable until the backend confirms credit.",
    },
    {
      label: "Active return commitment",
      value: vault.active_return_commitment,
      hint: "Accepted Brand Return money still awaiting a terminal provider outcome.",
    },
    {
      label: "TDS buffer",
      value: vault.tds_buffer_balance,
      hint: "Backend-managed tax buffer; no Settings mutation is exposed.",
    },
    {
      label: "Total pooled balance",
      value: vault.total_pooled_balance,
      hint: "Authoritative cleared balance across the pooled Brand vault.",
    },
  ];

  return (
    <div className="brand-escrow-metrics" aria-label="Vault monetary state">
      {metrics.map((metric) => (
        <div className="brand-escrow-metrics__item" key={metric.label}>
          <p className="brand-escrow-metrics__label">{metric.label}</p>
          <p
            className={`brand-escrow-metrics__value${
              metric.accent ? " brand-escrow-metrics__value--accent" : ""
            }`}
            aria-label={`${metric.label}: ${displayCurrency(metric.value, vault.currency)}`}
          >
            {displayCurrency(metric.value, vault.currency)}
          </p>
          <p className="brand-escrow-metrics__hint">{metric.hint}</p>
        </div>
      ))}
    </div>
  );
}
