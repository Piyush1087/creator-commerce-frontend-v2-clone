import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ChevronDown, CircleAlert, Loader2, Receipt } from "lucide-react";

import { Alert, Button, TextField } from "../../../../design-system/aurora";
import { SideDrawer } from "../../../../design-system/aurora/components/SideDrawer";
import type {
  BillingRequiredField,
  BrandBillingProfileResponse,
  UpsertBrandBillingProfilePayload,
} from "../../contracts/brand-settings.contracts";
import { settingsDisplayText } from "../../utils/brand-settings-display";

type BrandBillingProfileSectionProps = {
  data: BrandBillingProfileResponse | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  onSave: (payload: UpsertBrandBillingProfilePayload) => Promise<void>;
};

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

const REQUIRED_FIELD_LABELS: Record<BillingRequiredField, string> = {
  legal_entity_name: "legal entity name",
  legal_entity_type: "legal entity type",
  billing_country_code: "billing country",
  billing_address: "billing address",
};

export function BrandBillingProfileSection({
  data,
  loading,
  saving,
  error,
  onSave,
}: BrandBillingProfileSectionProps) {
  const [open, setOpen] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [legalEntityName, setLegalEntityName] = useState("");
  const [legalEntityType, setLegalEntityType] = useState("");
  const [billingCountryCode, setBillingCountryCode] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [gstin, setGstin] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const profile = data?.billing_profile;
  const readOnly = data?.is_read_only ?? false;

  useEffect(() => {
    if (!drawerOpen) return;
    setLegalEntityName(profile?.legal_entity_name ?? "");
    setLegalEntityType(profile?.legal_entity_type ?? "");
    setBillingCountryCode(profile?.billing_country_code ?? "");
    setBillingAddress(profile?.billing_address ?? "");
    setGstin(profile?.gstin ?? "");
    setFormError(null);
  }, [drawerOpen, profile]);

  const summaryRows = useMemo(
    () => [
      { label: "Legal entity name", value: settingsDisplayText(profile?.legal_entity_name) },
      { label: "Legal entity type", value: settingsDisplayText(profile?.legal_entity_type) },
      { label: "Billing country", value: settingsDisplayText(profile?.billing_country_code) },
      { label: "Billing address", value: settingsDisplayText(profile?.billing_address) },
      { label: "GSTIN (India only)", value: settingsDisplayText(profile?.gstin) },
      {
        label: "Profile lifecycle",
        value: data?.profile_state?.replace(/_/g, " ") ?? "NOT CONFIGURED",
      },
    ],
    [data?.profile_state, profile],
  );

  const handleSubmit = async () => {
    const normalizedName = legalEntityName.trim();
    const normalizedType = legalEntityType.trim();
    const normalizedCountry = billingCountryCode.trim().toUpperCase();
    const normalizedAddress = billingAddress.trim();
    const normalizedGstin = gstin.trim().toUpperCase();

    if (normalizedName.length < 2 || normalizedName.length > 100) {
      setFormError("Legal entity name must be between 2 and 100 characters.");
      return;
    }
    if (normalizedType.length < 2 || normalizedType.length > 100) {
      setFormError("Legal entity type must be between 2 and 100 characters.");
      return;
    }
    if (!/^[A-Z]{2}$/.test(normalizedCountry)) {
      setFormError("Billing country must be a two-letter ISO country code.");
      return;
    }
    if (normalizedAddress.length < 10 || normalizedAddress.length > 2000) {
      setFormError("Billing address must be between 10 and 2,000 characters.");
      return;
    }
    if (normalizedCountry === "IN" && normalizedGstin && !GSTIN_REGEX.test(normalizedGstin)) {
      setFormError("GSTIN must use the canonical 15-character India format.");
      return;
    }

    setFormError(null);
    try {
      await onSave({
        legalEntityName: normalizedName,
        legalEntityType: normalizedType,
        billingCountryCode: normalizedCountry,
        billingAddress: normalizedAddress,
        gstin: normalizedCountry === "IN" && normalizedGstin ? normalizedGstin : null,
      });
      setDrawerOpen(false);
    } catch (caught) {
      setFormError(
        caught instanceof Error ? caught.message : "Failed to save billing profile.",
      );
    }
  };

  const missingFields = data?.missing_required_fields ?? [];

  return (
    <>
      <section id="billing-profile" className="brand-settings__collapsible">
        <button
          type="button"
          className="brand-settings__collapsible-trigger"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
        >
          <div>
            <h2 className="brand-settings__collapsible-title">Billing profile</h2>
            <p className="brand-settings__collapsible-desc">
              Legal identity used for paid conversion and invoices
            </p>
          </div>
          <ChevronDown
            size={20}
            style={{
              transform: open ? "rotate(180deg)" : undefined,
              transition: "transform 0.2s ease",
              flexShrink: 0,
            }}
            aria-hidden
          />
        </button>
        {open ? (
          <div className="brand-settings__collapsible-body">
            {loading && !data ? (
              <div className="settings-page-stack settings-page-stack--centered">
                <Loader2 size={24} className="brand-escrow-spin" aria-hidden />
              </div>
            ) : (
              <>
                {error ? (
                  <Alert tone="error" title="Billing profile unavailable">{error}</Alert>
                ) : null}
                {!profile ? (
                  <div className="brand-settings__empty-state">
                    <Receipt size={48} color="var(--text-muted)" aria-hidden />
                    <p style={{ margin: 0, maxWidth: "28rem", color: "var(--text-muted)" }}>
                      Your trial can continue without billing details. Complete this profile before
                      converting to a paid Founder&apos;s Beta subscription.
                    </p>
                  </div>
                ) : (
                  <dl className="settings-summary-grid">
                    {summaryRows.map((row) => (
                      <div key={row.label} className="settings-summary-grid__item">
                        <dt>{row.label}</dt>
                        <dd>{row.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}

                <div
                  className={`settings-billing-readiness ${
                    data?.is_complete_for_paid_conversion
                      ? "settings-billing-readiness--ready"
                      : "settings-billing-readiness--incomplete"
                  }`}
                  role="status"
                >
                  {data?.is_complete_for_paid_conversion ? (
                    <CheckCircle2 size={20} aria-hidden />
                  ) : (
                    <CircleAlert size={20} aria-hidden />
                  )}
                  <div>
                    <strong>
                      {data?.is_complete_for_paid_conversion
                        ? "Ready for paid conversion"
                        : "Paid conversion profile incomplete"}
                    </strong>
                    {!data?.is_complete_for_paid_conversion && missingFields.length > 0 ? (
                      <p>
                        Add {missingFields.map((field) => REQUIRED_FIELD_LABELS[field]).join(", ")}.
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="settings-section-card__actions">
                  <Button variant="outline" onClick={() => setDrawerOpen(true)} disabled={readOnly}>
                    {profile ? "Update billing profile" : "Add billing profile"}
                  </Button>
                  {readOnly ? (
                    <p className="settings-team__capacity-warning">
                      Campaign Managers can view masked billing data. An Owner or Finance Admin
                      can update it.
                    </p>
                  ) : null}
                </div>
              </>
            )}
          </div>
        ) : null}
      </section>

      <SideDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Billing profile"
        subtitle="Use the legal identity and billing address that should appear on invoices."
        width="460px"
        footer={
          <div className="settings-drawer-footer">
            <Button variant="ghost" onClick={() => setDrawerOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" disabled={saving || readOnly} onClick={() => void handleSubmit()}>
              {saving ? "Saving…" : "Save billing profile"}
            </Button>
          </div>
        }
      >
        <div className="settings-drawer-body">
          {formError ? (
            <Alert tone="error" title="Check billing details">{formError}</Alert>
          ) : null}
          <TextField
            label="Legal entity name"
            value={legalEntityName}
            minLength={2}
            maxLength={100}
            onChange={(event) => setLegalEntityName(event.target.value)}
            disabled={readOnly}
          />
          <TextField
            label="Legal entity type"
            value={legalEntityType}
            minLength={2}
            maxLength={100}
            placeholder="Private Limited Company, LLC, partnership…"
            onChange={(event) => setLegalEntityType(event.target.value)}
            disabled={readOnly}
          />
          <TextField
            label="Billing country (ISO alpha-2)"
            value={billingCountryCode}
            minLength={2}
            maxLength={2}
            helperText="This is independent of the Brand workspace's primary country."
            placeholder="IN"
            onChange={(event) => setBillingCountryCode(event.target.value.toUpperCase())}
            disabled={readOnly}
          />
          <TextField
            label="Billing address"
            multiline
            rows={4}
            minLength={10}
            maxLength={2000}
            value={billingAddress}
            onChange={(event) => setBillingAddress(event.target.value)}
            disabled={readOnly}
          />
          {billingCountryCode.trim().toUpperCase() === "IN" ? (
            <TextField
              label="GSTIN (optional)"
              value={gstin}
              maxLength={15}
              helperText="Stored as provided for invoicing; this does not indicate verification."
              onChange={(event) => setGstin(event.target.value.toUpperCase())}
              disabled={readOnly}
              placeholder="27ABCDE1234F1Z5"
            />
          ) : null}
        </div>
      </SideDrawer>
    </>
  );
}
