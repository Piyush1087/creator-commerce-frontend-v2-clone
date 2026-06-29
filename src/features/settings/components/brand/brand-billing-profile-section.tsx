import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Loader2, Receipt } from "lucide-react";

import { Alert, Button, TextField } from "../../../../design-system/aurora";
import { SideDrawer } from "../../../../design-system/aurora/components/SideDrawer";
import type { BrandBillingProfileResponse } from "../../contracts/brand-settings.contracts";
import { settingsDisplayText } from "../../utils/brand-settings-display";

type BrandBillingProfileSectionProps = {
  data: BrandBillingProfileResponse | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  onSave: (payload: {
    registeredCompanyName: string;
    corporateBillingAddress: string;
    gstin?: string | null;
    pan?: string | null;
    defaultTdsPercentage?: number;
    currencyPreference?: string;
  }) => Promise<void>;
};

const TDS_OPTIONS = [
  { value: 0, label: "0.00% Exempt" },
  { value: 1, label: "1.00% Sec 194-O" },
  { value: 2, label: "2.00% Sec 194-C Corporate" },
];

export function BrandBillingProfileSection({
  data,
  loading,
  saving,
  error,
  onSave,
}: BrandBillingProfileSectionProps) {
  const [open, setOpen] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [address, setAddress] = useState("");
  const [gstin, setGstin] = useState("");
  const [pan, setPan] = useState("");
  const [tds, setTds] = useState(2);
  const [currency, setCurrency] = useState("INR");
  const [formError, setFormError] = useState<string | null>(null);

  const profile = data?.billing_profile;
  const readOnly = data?.is_read_only ?? false;

  useEffect(() => {
    if (drawerOpen) {
      setCompanyName(profile?.registered_company_name ?? "");
      setAddress(profile?.corporate_billing_address ?? "");
      setGstin(profile?.gstin ?? "");
      setPan(profile?.pan ?? "");
      setTds(profile?.default_tds_percentage ?? 2);
      setCurrency(profile?.currency_preference ?? "INR");
      setFormError(null);
    }
  }, [drawerOpen, profile]);

  const summaryRows = useMemo(
    () => [
      {
        label: "Registered company name",
        value: settingsDisplayText(profile?.registered_company_name),
      },
      {
        label: "Corporate billing address",
        value: settingsDisplayText(profile?.corporate_billing_address),
      },
      { label: "GSTIN", value: settingsDisplayText(profile?.gstin) },
      { label: "PAN", value: settingsDisplayText(profile?.pan) },
      {
        label: "Default TDS",
        value:
          profile?.default_tds_percentage !== undefined &&
          profile.default_tds_percentage !== null
            ? `${profile.default_tds_percentage.toFixed(2)}%`
            : settingsDisplayText(null),
      },
      {
        label: "Currency preference",
        value: settingsDisplayText(profile?.currency_preference),
      },
    ],
    [profile],
  );

  const handleSubmit = async () => {
    if (companyName.trim().length < 2 || address.trim().length < 10) {
      setFormError("Company name and a complete billing address are required.");
      return;
    }
    setFormError(null);
    try {
      await onSave({
        registeredCompanyName: companyName.trim(),
        corporateBillingAddress: address.trim(),
        gstin: gstin.trim() ? gstin.trim().toUpperCase() : null,
        pan: pan.trim() ? pan.trim().toUpperCase() : null,
        defaultTdsPercentage: tds,
        currencyPreference: currency.trim().toUpperCase() || "INR",
      });
      setDrawerOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save billing profile.");
    }
  };

  return (
    <>
      <section className="brand-settings__collapsible">
        <button
          type="button"
          className="brand-settings__collapsible-trigger"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
        >
          <div>
            <h2 className="brand-settings__collapsible-title">Billing Details</h2>
            <p className="brand-settings__collapsible-desc">
              Your organization and tax information
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
                  <Alert tone="error" title="Billing profile unavailable">
                    {error}
                  </Alert>
                ) : null}
                {!profile ? (
                  <div className="brand-settings__empty-state">
                    <Receipt size={48} color="var(--text-muted)" aria-hidden />
                    <p style={{ margin: 0, maxWidth: "20rem", color: "var(--text-muted)" }}>
                      No billing details added yet. Add your organization info for invoices.
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
                <div className="settings-section-card__actions">
                  <Button
                    variant="outline"
                    onClick={() => setDrawerOpen(true)}
                    disabled={readOnly}
                  >
                    {profile ? "Update Billing Details" : "Add Billing Details"}
                  </Button>
                  {readOnly ? (
                    <p className="settings-team__capacity-warning">
                      Read-only: contact a Finance Admin to update billing profiles.
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
        title="Corporate taxation & billing profile"
        subtitle="Billing data required for real-time tax calculations during milestone executions."
        width="460px"
        footer={
          <div className="settings-drawer-footer">
            <Button variant="ghost" onClick={() => setDrawerOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" disabled={saving || readOnly} onClick={() => void handleSubmit()}>
              {saving ? "Saving…" : "Save billing data"}
            </Button>
          </div>
        }
      >
        <div className="settings-drawer-body">
          {formError ? (
            <Alert tone="error" title="Validation error">
              {formError}
            </Alert>
          ) : null}
          <TextField
            label="Registered company name"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            disabled={readOnly}
          />
          <TextField
            label="Corporate billing address"
            multiline
            rows={3}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={readOnly}
          />
          <TextField
            label="Statutory GSTIN (India layout)"
            value={gstin}
            onChange={(e) => setGstin(e.target.value.toUpperCase())}
            disabled={readOnly}
            placeholder={settingsDisplayText(null)}
          />
          <TextField
            label="Income Tax PAN (10-character string)"
            value={pan}
            onChange={(e) => setPan(e.target.value.toUpperCase())}
            disabled={readOnly}
            placeholder={settingsDisplayText(null)}
          />
          <fieldset className="settings-role-fieldset">
            <legend>Default fallback TDS tracking mode</legend>
            {TDS_OPTIONS.map((option) => (
              <label key={option.value} className="settings-role-option">
                <input
                  type="radio"
                  name="tds-mode"
                  checked={tds === option.value}
                  disabled={readOnly}
                  onChange={() => setTds(option.value)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </fieldset>
          <TextField
            label="Currency preference (ISO)"
            value={currency}
            maxLength={3}
            onChange={(e) => setCurrency(e.target.value.toUpperCase())}
            disabled={readOnly}
            placeholder={settingsDisplayText(null)}
          />
        </div>
      </SideDrawer>
    </>
  );
}
