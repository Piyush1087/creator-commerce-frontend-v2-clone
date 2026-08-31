import { useEffect, useMemo, useState } from "react";
import { Mail, ShieldCheck } from "lucide-react";

import { Alert, Button } from "../../../../design-system/aurora";
import type {
  BrandNotificationsResponse,
  NotificationCategory,
  UpdateBrandNotificationsPayload,
} from "../../contracts/brand-settings.contracts";
import { SettingsSectionCard } from "../settings-section-card";

const CATEGORIES: Array<{ category: NotificationCategory; label: string }> = [
  { category: "BILLING_SUBSCRIPTION", label: "Billing & Subscription" },
  { category: "ESCROW_PAYOUTS", label: "Escrow & Payouts" },
  { category: "CAMPAIGNS_APPLICATIONS", label: "Campaigns & Applications" },
  { category: "COLLABORATIONS", label: "Collaborations" },
  { category: "BRAND_INTELLIGENCE", label: "Brand Intelligence" },
  { category: "TEAM_ACCOUNT_INTEGRATIONS", label: "Team, Account & Integrations" },
];

type PreferenceRow = {
  category: NotificationCategory;
  label: string;
  optionalEmailEnabled: boolean;
};

function buildRows(data: BrandNotificationsResponse | null): PreferenceRow[] {
  return CATEGORIES.map((canonical) => {
    const persisted = data?.settings.find(
      (setting) => setting.category === canonical.category,
    );
    return {
      category: canonical.category,
      label: persisted?.label ?? canonical.label,
      optionalEmailEnabled: persisted?.optional_email_enabled ?? true,
    };
  });
}

function notificationRowsToPayload(
  rows: PreferenceRow[],
): UpdateBrandNotificationsPayload {
  return {
    settings: rows.map((row) => ({
      category: row.category,
      optionalEmailEnabled: row.optionalEmailEnabled,
    })),
  };
}

type BrandNotificationsSectionProps = {
  data: BrandNotificationsResponse | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  onSave: (payload: UpdateBrandNotificationsPayload) => Promise<void>;
};

export function BrandNotificationsSection({
  data,
  loading,
  saving,
  error,
  onSave,
}: BrandNotificationsSectionProps) {
  const baseline = useMemo(() => buildRows(data), [data]);
  const [rows, setRows] = useState<PreferenceRow[]>(baseline);
  const [dirty, setDirty] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setRows(baseline);
    setDirty(false);
  }, [baseline]);

  const updateRow = (category: NotificationCategory, enabled: boolean) => {
    setRows((current) =>
      current.map((row) =>
        row.category === category
          ? { ...row, optionalEmailEnabled: enabled }
          : row,
      ),
    );
    setDirty(true);
  };

  const handleSave = async () => {
    setFormError(null);
    try {
      await onSave(notificationRowsToPayload(rows));
      setDirty(false);
    } catch (caught) {
      setFormError(
        caught instanceof Error
          ? caught.message
          : "Failed to save notification preferences.",
      );
    }
  };

  return (
    <SettingsSectionCard
      title="Your email preferences"
      description="Choose optional email updates for your user account in this Brand workspace."
    >
      {error ? (
        <Alert tone="error" title="Notification preferences unavailable">{error}</Alert>
      ) : null}
      {formError ? (
        <Alert tone="error" title="Could not save preferences">{formError}</Alert>
      ) : null}

      <div className="settings-notifications__mandatory-note" role="note">
        <ShieldCheck size={20} aria-hidden />
        <p>
          Required service, security, legal, and account emails remain enabled. These preferences
          affect optional email only.
        </p>
      </div>

      {loading && !data ? (
        <p className="cc-muted">Loading your email preferences…</p>
      ) : (
        <>
          <div className="settings-notifications__cards">
            {rows.map((row) => (
              <label key={row.category} className="settings-notifications__card">
                <span className="settings-notifications__card-copy">
                  <Mail size={19} aria-hidden />
                  <span>
                    <strong>{row.label}</strong>
                    <small>Optional email</small>
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={row.optionalEmailEnabled}
                  aria-label={`Optional email for ${row.label}`}
                  onChange={(event) => updateRow(row.category, event.target.checked)}
                />
              </label>
            ))}
          </div>
          <div className="settings-section-card__actions">
            <Button
              variant="primary"
              disabled={!dirty || saving}
              onClick={() => void handleSave()}
            >
              {saving ? "Saving…" : "Save email preferences"}
            </Button>
            {dirty ? <span className="cc-muted">You have unsaved changes.</span> : null}
          </div>
        </>
      )}
    </SettingsSectionCard>
  );
}
