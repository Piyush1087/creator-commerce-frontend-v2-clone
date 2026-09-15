import { useEffect, useRef, useState } from "react";
import { Button, SelectField, TextField } from "../../../design-system/aurora";
import {
  MONEY_KEYS,
  RateValuesSchema,
  emptyRates,
  type RateValues,
  type WorkConsumer,
  type RateConsumer,
  type RateCommand,
} from "../contracts/commercial.schema";
import {
  RATE_LABELS,
  RATE_TERMS,
  formatMinor,
  parsePrice,
} from "../contracts/rate-card.presentation";
type Prices = Record<(typeof MONEY_KEYS)[number], string>;
const priceTexts = (values: RateValues) =>
  Object.fromEntries(
    MONEY_KEYS.map((key) => [key, formatMinor(values[key].amountMinor)]),
  ) as Prices;
export function RateCardForm({
  rates,
  work,
  disabled,
  pending,
  save,
}: {
  rates: RateConsumer;
  work: WorkConsumer | null;
  disabled: boolean;
  pending: boolean;
  save: (command: RateCommand) => Promise<boolean>;
}) {
  const [draft, setDraft] = useState<RateValues>(
      () => rates.values ?? emptyRates(),
    ),
    [prices, setPrices] = useState(() =>
      priceTexts(rates.values ?? emptyRates()),
    ),
    [dirty, setDirty] = useState(false),
    [error, setError] = useState<string | null>(null);
  const errorBox = useRef<HTMLParagraphElement>(null),
    button = useRef<HTMLButtonElement>(null),
    identity = useRef<{ hash: string; key: string } | null>(null);
  useEffect(() => {
    if (!dirty) {
      const values = rates.values ?? emptyRates();
      setDraft(values);
      setPrices(priceTexts(values));
    }
  }, [rates, dirty]);
  const canEdit = rates.context.allowedActions.includes("RATE_CARD_EDIT"),
    stale = rates.state === "MONETARY_RATES_REQUIRE_REENTRY",
    countryReady =
      rates.country.state === "AVAILABLE" &&
      work !== null &&
      work.currentRevision > 0;
  const update = <K extends keyof RateValues>(key: K, value: RateValues[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setDirty(true);
    setError(null);
  };
  const send = async (reconcile = false) => {
    if (
      disabled ||
      pending ||
      !canEdit ||
      !countryReady ||
      !work ||
      !rates.country.authorityFingerprint
    )
      return;
    const values = reconcile ? (rates.values ?? emptyRates()) : { ...draft };
    if (!reconcile)
      for (const key of MONEY_KEYS) {
        const amount = draft[key].enabled ? parsePrice(prices[key]) : null;
        if (draft[key].enabled && amount === null) {
          setError(
            `Enter a positive ${RATE_LABELS[key].label} starting price with at most two decimal places.`,
          );
          requestAnimationFrame(() => errorBox.current?.focus());
          return;
        }
        values[key] = { enabled: draft[key].enabled, amountMinor: amount };
      }
    const parsed = RateValuesSchema.safeParse(values);
    if (!parsed.success) {
      setError(
        "Check usage-right duration and payment preferences. Enabled prices must be positive and disabled prices empty.",
      );
      requestAnimationFrame(() => errorBox.current?.focus());
      return;
    }
    const body = {
      expectedRevision: rates.currentRevision,
      expectedWorkPreferencesRevision: work.currentRevision,
      authorityFingerprint: rates.country.authorityFingerprint,
      values: parsed.data,
    };
    const hash = JSON.stringify(body);
    if (identity.current?.hash !== hash)
      identity.current = { hash, key: crypto.randomUUID() };
    if (await save({ ...body, idempotencyKey: identity.current.key })) {
      setDirty(false);
      setError(null);
      identity.current = null;
      requestAnimationFrame(() => button.current?.focus());
    }
  };
  return (
    <form
      aria-label="Rate Card"
      onSubmit={(event) => {
        event.preventDefault();
        void send();
      }}
    >
      <p>
        Starting from references only — never fixed prices, quotes or agreed
        compensation.
      </p>
      <p>
        Canonical currency:{" "}
        <strong>
          {rates.country.canonicalRateCardCurrency ?? "Unavailable"}
        </strong>{" "}
        — resolved by the platform, not editable. No currency conversion.
      </p>
      {!canEdit && (
        <p>
          Assistant access is read-only. Ask an Owner or Manager to change
          rates.
        </p>
      )}
      {!countryReady && (
        <p>
          Configure Work Preferences or recover country authority in
          Settings/Payouts before entering monetary rates.
        </p>
      )}
      {stale && (
        <>
          <p>
            Monetary rates require reentry. Old monetary values are unavailable
            because country authority changed. Reconcile first: same-currency
            prices are retained; changed-currency prices clear. Rights/payment
            preferences remain available.
          </p>
          {canEdit && (
            <Button
              ref={button}
              type="button"
              disabled={disabled || pending || !countryReady}
              onClick={() => void send(true)}
            >
              Reconcile Rate Card currency
            </Button>
          )}
        </>
      )}
      <p ref={errorBox} role={error ? "alert" : undefined} tabIndex={-1}>
        {error}
      </p>
      <fieldset
        className="commercial-fields"
        disabled={disabled || pending || !canEdit || !countryReady || stale}
      >
        {MONEY_KEYS.map((key) => (
          <div className="commercial-rate" key={key}>
            <h3>{RATE_LABELS[key].label}</h3>
            <p>{RATE_LABELS[key].reference}</p>
            <SelectField
              label={`Enable ${RATE_LABELS[key].label} starting price`}
              options={[
                { value: "NO", label: "Not enabled" },
                { value: "YES", label: "Enabled" },
              ]}
              value={draft[key].enabled ? "YES" : "NO"}
              onChange={(event) => {
                const enabled = event.target.value === "YES";
                update(key, {
                  enabled,
                  amountMinor: enabled ? draft[key].amountMinor : null,
                });
                if (!enabled)
                  setPrices((current) => ({ ...current, [key]: "" }));
              }}
            />
            <TextField
              label={`Starting from — ${RATE_LABELS[key].label} (${rates.country.canonicalRateCardCurrency ?? "currency unavailable"})`}
              inputMode="decimal"
              value={prices[key]}
              disabled={!draft[key].enabled}
              helperText="Positive amount, up to two decimal places. This does not grant rights or lock compensation."
              onChange={(event) => {
                setPrices((current) => ({
                  ...current,
                  [key]: event.target.value,
                }));
                setDirty(true);
                setError(null);
              }}
            />
          </div>
        ))}
        <SelectField
          label="Content usage rights available"
          options={[
            { value: "", label: "Not answered" },
            { value: "YES", label: "Yes" },
            { value: "NO", label: "No" },
          ]}
          value={draft.contentUsageRights ?? ""}
          helperText="Availability is not a rights grant. No separate published V0 usage-right price."
          onChange={(event) => {
            const value = event.target.value;
            update(
              "contentUsageRights",
              value === "" ? null : (value as "YES" | "NO"),
            );
            if (value !== "YES") update("usageDays", null);
          }}
        />
        {draft.contentUsageRights === "YES" && (
          <TextField
            label="Optional usage duration (days)"
            type="number"
            min="1"
            step="1"
            value={draft.usageDays ?? ""}
            onChange={(event) =>
              update(
                "usageDays",
                event.target.value === "" ? null : Number(event.target.value),
              )
            }
          />
        )}
        <SelectField
          label="Advance payment preference"
          options={[
            { value: "", label: "Not answered" },
            ...[0, 25, 50, 75, 100].map((value) => ({
              value: String(value),
              label: `${value}%`,
            })),
          ]}
          value={draft.advancePercent ?? ""}
          onChange={(event) =>
            update(
              "advancePercent",
              event.target.value === ""
                ? null
                : (Number(event.target.value) as RateValues["advancePercent"]),
            )
          }
        />
        <SelectField
          label="Balance payment preference"
          options={[
            { value: "", label: "Not answered" },
            ...[7, 15, 30, 45, 60].map((value) => ({
              value: `NET_${value}`,
              label: `Net ${value} days`,
            })),
          ]}
          value={draft.balanceTerm ?? ""}
          onChange={(event) =>
            update(
              "balanceTerm",
              event.target.value === ""
                ? null
                : (event.target.value as RateValues["balanceTerm"]),
            )
          }
        />
        {canEdit && (
          <Button ref={button} fullWidthOnMobile type="submit">
            {pending ? "Saving…" : "Save Rate Card"}
          </Button>
        )}
      </fieldset>
      <p>
        UGC-project willingness:{" "}
        {rates.workPreferences.ugcProjects ?? "Not answered"}; gifting/barter
        willingness: {rates.workPreferences.giftingBarter ?? "Not answered"}.
        Read-only from Work Preferences — neither creates a rate item or
        compensation rail.
      </p>
      <h3>Final terms take precedence</h3>
      <ul>
        {RATE_TERMS.map((term) => (
          <li key={term}>{term}</li>
        ))}
      </ul>
    </form>
  );
}
