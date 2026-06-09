import type { EscrowVaultApiResponse } from "../contracts/escrow.contracts";
import { displayCurrency } from "../utils/display-value";

type EscrowBalanceMetricsProps = {
  vault: EscrowVaultApiResponse | null;
};

export function EscrowBalanceMetrics({ vault }: EscrowBalanceMetricsProps) {
  const currency = vault?.currency ?? null;

  return (
    <div className="brand-escrow-metrics">
      <div className="brand-escrow-metrics__item">
        <p className="brand-escrow-metrics__label">Total Pooled Balance</p>
        <p className="brand-escrow-metrics__value brand-escrow-metrics__value--accent">
          {displayCurrency(vault?.total_pooled_balance, currency)}
        </p>
        <p className="brand-escrow-metrics__hint">
          Sum total of all cleared liquidity within your virtual banking node.
        </p>
      </div>
      <div className="brand-escrow-metrics__item">
        <p className="brand-escrow-metrics__label">Locked Campaign Funds</p>
        <p className="brand-escrow-metrics__value">
          {displayCurrency(vault?.locked_campaign_funds, currency)}
        </p>
        <p className="brand-escrow-metrics__hint">
          Escrow capital securely frozen for active Stage 2 to Stage 5 contracts.
        </p>
      </div>
      <div className="brand-escrow-metrics__item">
        <p className="brand-escrow-metrics__label">Available Balance</p>
        <p className="brand-escrow-metrics__value brand-escrow-metrics__value--accent">
          {displayCurrency(vault?.available_balance, currency)}
        </p>
        <p className="brand-escrow-metrics__hint">
          Free unallocated capital ready to fund newly approved creators.
        </p>
      </div>
    </div>
  );
}
