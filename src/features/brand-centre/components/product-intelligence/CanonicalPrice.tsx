import { useState, type FormEvent } from "react";
import { Alert, Badge, Button, SelectField, TextField } from "../../../../design-system/aurora";
import { putManualOfferingPrice } from "../../api/product-intelligence-client";
import { manualPriceInputSchema, type ProductConsumer } from "../../schemas/product-intelligence-schema";
import type { ProductView } from "../../adapters/map-product-intelligence";
import { priceEditValues } from "./price-edit-state";

type Price = ProductConsumer["offering"]["canonicalPrice"];
const modes = [
  { value: "EXACT", label: "Exact" },
  { value: "STARTING_AT", label: "Starting at" },
  { value: "RANGE", label: "Range" },
  { value: "NOT_PUBLICLY_LISTED", label: "Not publicly listed" },
];

export function CanonicalPrice({ offeringId, price, view, onSaved }: {
  offeringId: string;
  price: Price;
  view: ProductView;
  onSaved: () => Promise<void>;
}) {
  const initial = priceEditValues(price);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState(false);
  const [mode, setMode] = useState(initial.mode);
  const [min, setMin] = useState(initial.min);
  const [max, setMax] = useState(initial.max);
  const [currency, setCurrency] = useState(initial.currency);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function beginEdit() {
    const latest = priceEditValues(price);
    setMode(latest.mode);
    setMin(latest.min);
    setMax(latest.max);
    setCurrency(latest.currency);
    setErrors({});
    setFailure(false);
    setEditing(true);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const input = {
      mode,
      currentMinAmount: mode === "NOT_PUBLICLY_LISTED" ? undefined : min || undefined,
      currentMaxAmount: mode === "EXACT" || mode === "RANGE" ? max || undefined : undefined,
      currency,
    };
    const parsed = manualPriceInputSchema.safeParse(input);
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message])));
      return;
    }
    setSaving(true);
    setFailure(false);
    try {
      await putManualOfferingPrice(offeringId, parsed.data);
      await onSaved();
      setEditing(false);
    } catch {
      setFailure(true);
    } finally {
      setSaving(false);
    }
  }

  return <section className="price-card" aria-labelledby="canonical-price-heading">
    <div className="section-heading">
      <div><p className="eyebrow">Canonical price</p><h2 id="canonical-price-heading">{view.priceLabel}</h2></div>
      <Button type="button" variant="outline" size="sm" onClick={beginEdit} disabled={editing}>Edit</Button>
    </div>
    {price.state === "CURRENT" && price.freshness === "STALE" ? <p className="meta">May need updating · last evaluated {new Date(price.evaluatedAt).toLocaleDateString()}</p> : null}
    {view.manuallyManaged ? <div><Badge tone="success">Manually managed</Badge><p className="meta">Automatic website updates won’t replace this price.</p></div> : null}
    {editing ? <form className="price-form" onSubmit={submit} noValidate>
      <SelectField label="Price mode" options={modes} value={mode} onChange={(event) => setMode(event.target.value as typeof mode)}/>
      {mode !== "NOT_PUBLICLY_LISTED" ? <TextField label={mode === "STARTING_AT" ? "Starting price" : mode === "RANGE" ? "Minimum price" : "Price"} inputMode="decimal" value={min} onChange={(event) => { setMin(event.target.value); if (mode === "EXACT") setMax(event.target.value); }} error={errors.currentMinAmount}/> : null}
      {mode === "RANGE" ? <TextField label="Maximum price" inputMode="decimal" value={max} onChange={(event) => setMax(event.target.value)} error={errors.currentMaxAmount}/> : null}
      <TextField label="Currency" maxLength={3} value={currency} onChange={(event) => setCurrency(event.target.value.toUpperCase())} error={errors.currency}/>
      {failure ? <Alert tone="error" title="Price was not saved">Your current price is unchanged. Check the values and try again.</Alert> : null}
      <div className="form-actions">
        <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        <Button type="button" variant="outline" onClick={() => { setEditing(false); setFailure(false); }} disabled={saving}>Cancel</Button>
      </div>
    </form> : null}
  </section>;
}
