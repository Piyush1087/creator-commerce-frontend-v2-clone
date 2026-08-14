import type { CanonicalReadinessCurrency } from "../../api/canonical-campaign-draft-client";
import { currencySymbol, formatCommercialAmount, parseCommercialAmount } from "./commercial-strategy-model";

export function CurrencyAmountField({ id, value, currency, optional, onChange, onBlur, describedBy }: { id: string; value: number | null; currency: CanonicalReadinessCurrency; optional?: boolean; onChange: (value: number | null) => void; onBlur: () => void; describedBy?: string }) {
  return <div className="commercial-currency-field"><span aria-hidden="true">{currencySymbol(currency)}</span><input id={id} className="cw-input" inputMode="numeric" value={formatCommercialAmount(value, currency)} placeholder={optional ? "Optional" : undefined} aria-describedby={describedBy} onChange={(event) => { const parsed = parseCommercialAmount(event.target.value); if (parsed != null || optional && !event.target.value.trim()) onChange(parsed); }} onBlur={onBlur} /><strong aria-label={`Currency ${currency}`}>{currency}</strong></div>;
}
