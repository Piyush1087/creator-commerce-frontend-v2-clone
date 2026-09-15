import { useEffect, useId, useRef, useState } from "react";
import {
  Button,
  SelectField,
  TextField,
  SideDrawer,
} from "../../../design-system/aurora";
import {
  COMMERCIAL_COUNTRY_CODES,
  INDUSTRY_IDS,
  WorkValuesSchema,
  type WorkValues,
  type WorkConsumer,
  type RateConsumer,
  type WorkCommand,
} from "../contracts/commercial.schema";
const answers = [
  { value: "", label: "Not answered" },
  { value: "YES", label: "Yes" },
  { value: "NO", label: "No" },
];
const defaults: WorkValues = {
  baseCountry: "",
  openToInternationalBrands: null,
  preferredIndustryIds: [],
  excludedIndustryIds: [],
  availability: "ACCEPTING_COLLABORATIONS",
  pausedUntil: null,
  physicalProductCollaborations: null,
  ugcProjects: null,
  giftingBarter: null,
};
const names = new Intl.DisplayNames(["en"], { type: "region" });
const countryOptions = [
  { value: "", label: "Choose base country" },
  ...COMMERCIAL_COUNTRY_CODES.map((code) => ({
    value: code,
    label: `${names.of(code) ?? code} (${code})`,
  })),
];
const industryLabels = {
  D2C: "D2C",
  HEALTHCARE: "Healthcare",
  OFFLINE_SERVICES: "Offline services",
  SAAS_AI: "SaaS / AI",
};
export function WorkPreferencesForm({
  work,
  rates,
  disabled,
  pending,
  save,
}: {
  work: WorkConsumer;
  rates: RateConsumer | null;
  disabled: boolean;
  pending: boolean;
  save: (command: WorkCommand) => Promise<boolean>;
}) {
  const [draft, setDraft] = useState<WorkValues>(
      () =>
        work.values ?? {
          ...defaults,
          baseCountry: work.country.effectiveBaseCountry ?? "",
        },
    ),
    [dirty, setDirty] = useState(false),
    [errors, setErrors] = useState<Record<string, string>>({}),
    [confirm, setConfirm] = useState(false);
  const submitButton = useRef<HTMLButtonElement>(null),
    errorBox = useRef<HTMLDivElement>(null),
    cancel = useRef<HTMLButtonElement>(null),
    identity = useRef<{ hash: string; key: string } | null>(null),
    group = useId();
  useEffect(() => {
    if (!dirty)
      setDraft(
        work.values ?? {
          ...defaults,
          baseCountry: work.country.effectiveBaseCountry ?? "",
        },
      );
  }, [work, dirty]);
  const update = <K extends keyof WorkValues>(key: K, value: WorkValues[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setDirty(true);
    setErrors({});
  };
  const send = async (confirmed = false) => {
    if (disabled || pending || !rates) return;
    const parsed = WorkValuesSchema.safeParse(draft);
    const fieldErrors: Record<string, string> = {};
    if (!parsed.success)
      for (const issue of parsed.error.issues)
        fieldErrors[String(issue.path[0] ?? "values")] = issue.message;
    if (
      draft.availability === "PAUSED_UNTIL" &&
      (!draft.pausedUntil ||
        new Date(draft.pausedUntil).getTime() <= Date.now())
    )
      fieldErrors.pausedUntil = "Choose a future pause date.";
    if (Object.keys(fieldErrors).length) {
      setErrors(fieldErrors);
      requestAnimationFrame(() => errorBox.current?.focus());
      return;
    }
    if (!parsed.success) return;
    const nextCurrency = draft.baseCountry === "IN" ? "INR" : "USD";
    const hasMoney =
      rates.values &&
      Object.values(rates.values).some(
        (value) =>
          typeof value === "object" &&
          value !== null &&
          "enabled" in value &&
          value.enabled,
      );
    if (
      !confirmed &&
      work.country.baseCountryEditable &&
      nextCurrency !== rates.country.canonicalRateCardCurrency &&
      hasMoney
    ) {
      setConfirm(true);
      return;
    }
    const body = {
      expectedRevision: work.currentRevision,
      expectedRateCardRevision: rates.currentRevision,
      confirmMonetaryReset: confirmed,
      values: parsed.data,
    };
    const hash = JSON.stringify(body);
    if (identity.current?.hash !== hash)
      identity.current = { hash, key: crypto.randomUUID() };
    if (await save({ ...body, idempotencyKey: identity.current.key })) {
      setConfirm(false);
      setDirty(false);
      setErrors({});
      identity.current = null;
      requestAnimationFrame(() => submitButton.current?.focus());
    } else {
      setConfirm(false);
    }
  };
  const canEdit = work.context.allowedActions.includes("WORK_PREFERENCES_EDIT");
  const answerField = (
    key:
      | "openToInternationalBrands"
      | "physicalProductCollaborations"
      | "ugcProjects"
      | "giftingBarter",
    label: string,
  ) => (
    <SelectField
      label={label}
      options={answers}
      value={draft[key] ?? ""}
      onChange={(event) =>
        update(
          key,
          event.target.value === ""
            ? null
            : (event.target.value as "YES" | "NO"),
        )
      }
    />
  );
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void send();
      }}
      aria-label="Work Preferences"
    >
      <div
        ref={errorBox}
        tabIndex={-1}
        role={Object.keys(errors).length ? "alert" : undefined}
      >
        {Object.keys(errors).length > 0 && (
          <>
            <p>Check the following fields:</p>
            <ul>
              {Object.entries(errors).map(([key, message]) => (
                <li key={key}>{message}</li>
              ))}
            </ul>
          </>
        )}
      </div>
      {!canEdit && (
        <p>
          Assistant access is read-only. Ask an Owner or Manager to change
          preferences.
        </p>
      )}
      <fieldset
        disabled={disabled || pending || !canEdit}
        className="commercial-fields"
      >
        <SelectField
          label="Base country"
          options={countryOptions}
          value={
            work.country.baseCountryEditable
              ? draft.baseCountry
              : (work.country.effectiveBaseCountry ?? "")
          }
          disabled={!work.country.baseCountryEditable}
          aria-invalid={Boolean(errors.baseCountry)}
          helperText={
            work.country.baseCountrySource === "PAYOUT_BANK"
              ? "Country comes from your current Settings bank destination. This is not bank or identity verification."
              : work.country.state === "CONFLICT"
                ? "Country authority needs recovery in Settings/Payouts; no manual fallback."
                : "Your operating/base country, not Audience geography. Currency is resolved by the platform."
          }
          onChange={(event) => update("baseCountry", event.target.value)}
        />
        {answerField(
          "openToInternationalBrands",
          "Open to international Brands",
        )}
        {(["preferredIndustryIds", "excludedIndustryIds"] as const).map(
          (key) => (
            <div role="group" aria-labelledby={`${group}-${key}`} key={key}>
              <h3 id={`${group}-${key}`}>
                {key === "preferredIndustryIds"
                  ? "Preferred industries"
                  : "Excluded industries"}
              </h3>
              <p>
                {key === "preferredIndustryIds"
                  ? "Industries you prefer to work with."
                  : "Industries you will not work with. Preferred and excluded must not overlap."}
              </p>
              <div className="commercial-options">
                {INDUSTRY_IDS.map((id) => (
                  <Button
                    type="button"
                    variant={draft[key].includes(id) ? "secondary" : "outline"}
                    key={id}
                    aria-pressed={draft[key].includes(id)}
                    onClick={() =>
                      update(
                        key,
                        draft[key].includes(id)
                          ? draft[key].filter((value) => value !== id)
                          : [...draft[key], id].sort(),
                      )
                    }
                  >
                    {industryLabels[id]}
                  </Button>
                ))}
              </div>
            </div>
          ),
        )}
        <SelectField
          label="Availability for new collaborations"
          options={[
            {
              value: "ACCEPTING_COLLABORATIONS",
              label: "Accepting collaborations",
            },
            { value: "PAUSED_UNTIL", label: "Paused until" },
            {
              value: "NOT_ACCEPTING_NEW_COLLABORATIONS",
              label: "Not accepting new collaborations",
            },
          ]}
          value={draft.availability}
          helperText="Preferences affect future/new opportunities only; existing Campaigns and Collaborations are unchanged."
          onChange={(event) => {
            update(
              "availability",
              event.target.value as WorkValues["availability"],
            );
            if (event.target.value !== "PAUSED_UNTIL")
              update("pausedUntil", null);
          }}
        />
        {draft.availability === "PAUSED_UNTIL" && (
          <TextField
            label="Paused until"
            type="date"
            value={draft.pausedUntil?.slice(0, 10) ?? ""}
            aria-invalid={Boolean(errors.pausedUntil)}
            error={errors.pausedUntil}
            onChange={(event) =>
              update(
                "pausedUntil",
                event.target.value
                  ? `${event.target.value}T23:59:59.000Z`
                  : null,
              )
            }
          />
        )}
        {answerField(
          "physicalProductCollaborations",
          "Physical-product collaboration willingness",
        )}
        {answerField("ugcProjects", "UGC-project willingness")}
        {answerField("giftingBarter", "Gifting/barter willingness")}
        {canEdit && (
          <Button ref={submitButton} fullWidthOnMobile type="submit">
            {pending ? "Saving…" : "Save Work Preferences"}
          </Button>
        )}
      </fieldset>
      <SideDrawer
        isOpen={confirm}
        onClose={() => {
          if (!pending) setConfirm(false);
        }}
        title="Confirm monetary reset"
        subtitle="Changing base country changes the canonical currency."
        initialFocusRef={cancel}
        restoreFocusRef={submitButton}
        footer={
          <div className="commercial-actions">
            <Button
              ref={cancel}
              variant="secondary"
              type="button"
              disabled={pending}
              onClick={() => setConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={pending}
              onClick={() => void send(true)}
            >
              Confirm country change and clear monetary rates
            </Button>
          </div>
        }
      >
        <p>
          All enabled Rate Card prices will be cleared atomically. No amount is
          converted or relabeled. Rights and payment preferences and previous
          revision history are preserved. Enter new starting prices in the newly
          resolved currency after saving.
        </p>
      </SideDrawer>
    </form>
  );
}
