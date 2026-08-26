import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Alert, TextField } from "../../../../design-system/aurora";
import { useBrandGeneralSettings } from "../../hooks/use-brand-general-settings";
import {
  initialsFromName,
  settingsDisplayText,
} from "../../utils/brand-settings-display";
import { SettingsSectionCard } from "../settings-section-card";
import { BrandTeamSettings } from "./brand-team-settings";
import { SettingsUnsavedBar } from "../settings-unsaved-bar";
type FormState = {
  firstName: string;
  lastName: string;
  companyName: string;
};
function formFromApi(
  data: NonNullable<ReturnType<typeof useBrandGeneralSettings>["data"]>,
): FormState {
  return {
    firstName: data.personal_profile.first_name ?? "",
    lastName: data.personal_profile.last_name ?? "",
    companyName: data.organization.company_legal_name ?? "",
  };
}
function displayFieldValue(value: string): string {
  return value.trim().length > 0 ? value : settingsDisplayText(null);
}
export function BrandGeneralSettings() {
  const {
    data,
    loading,
    saving,
    error,
    saveGeneral,
    inviteMember,
    revokeMember,
    cancelInvitation,
    changeRole,
  } = useBrandGeneralSettings();
  const [form, setForm] = useState<FormState | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  useEffect(() => {
    if (data) {
      setForm(formFromApi(data));
    }
  }, [data]);
  const baseline = useMemo(() => (data ? formFromApi(data) : null), [data]);
  const isDirty =
    form !== null &&
    baseline !== null &&
    (form.firstName !== baseline.firstName ||
      form.lastName !== baseline.lastName ||
      form.companyName !== baseline.companyName);
  const canEditOrg = data
    ? data.current_user_role !== "CAMPAIGN_MANAGER"
    : false;
  const resetForm = () => {
    if (baseline) {
      setForm(baseline);
    }
  };
  const handleSave = async () => {
    if (!form || !canEditOrg) {
      return;
    }
    setActionError(null);
    try {
      await saveGeneral({
        firstName: form.firstName.trim() || undefined,
        lastName: form.lastName.trim() || undefined,
        organizationLegalName: form.companyName.trim() || undefined,
      });
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to save changes.",
      );
    }
  };
  if (loading && !data) {
    return (
      <div className="settings-page-stack settings-page-stack--centered">
        <Loader2 size={28} className="brand-escrow-spin" aria-hidden />
        <p className="cc-muted">Loading workspace settings…</p>
      </div>
    );
  }
  if (!data || !form) {
    return (
      <Alert tone="error" title="Could not load settings">
        {error ?? "Workspace settings are unavailable right now."}
      </Alert>
    );
  }
  const logoInitials = initialsFromName(data.brand_identity.display_name);
  const websiteUrl = settingsDisplayText(data.brand_identity.website_url);
  return (
    <>
      {error || actionError ? (
        <Alert tone="error" title="Settings action failed">
          {actionError ?? error}
        </Alert>
      ) : null}
      <div className="settings-page-stack">
        <SettingsSectionCard
          title="Personal profile"
          description="Update your first and last name. Your account email is read-only."
        >
          <div>
            <div className="settings-form-grid">
              <TextField
                label="First name"
                value={form.firstName}
                placeholder={displayFieldValue("")}
                onChange={(e) =>
                  setForm((f) => f && { ...f, firstName: e.target.value })
                }
              />
              <TextField
                label="Last name"
                value={form.lastName}
                placeholder={displayFieldValue("")}
                onChange={(e) =>
                  setForm((f) => f && { ...f, lastName: e.target.value })
                }
              />
              <div className="settings-form-grid__full">
                <TextField
                  label="Account email address"
                  value={settingsDisplayText(data.personal_profile.email)}
                  readOnly
                  disabled
                  helperText="Account email cannot be changed in General settings."
                />
              </div>
            </div>
          </div>
        </SettingsSectionCard>
        <hr className="settings-section-divider" />
        <SettingsSectionCard
          title="Organization details"
          description="Manage the organization legal name. Primary country and reporting currency are protected Brand settings. Billing address and tax details belong to the Billing profile."
        >
          <div className="settings-form-grid settings-form-grid--two">
            <TextField
              label="Company legal name"
              value={form.companyName}
              placeholder={displayFieldValue("")}
              disabled={!canEditOrg}
              onChange={(e) =>
                setForm((f) => f && { ...f, companyName: e.target.value })
              }
            />
            <TextField
              label="Country location (ISO)"
              value={settingsDisplayText(data.organization.country_code)}
              placeholder={settingsDisplayText(null)}
              disabled
              readOnly
              helperText="Primary Brand geography cannot be changed in General settings."
            />
            <TextField
              label="Default operating currency (ISO)"
              value={settingsDisplayText(data.organization.currency_code)}
              placeholder={settingsDisplayText(null)}
              disabled
              readOnly
              helperText="Collaboration and reporting currency cannot be changed in General settings."
            />
          </div>
        </SettingsSectionCard>
        <SettingsSectionCard
          title="Brand identity"
          description="View the verified brand website parameters and workspace onboarding domains."
        >
          <div className="settings-brand-identity">
            <div className="settings-brand-identity__logo">{logoInitials}</div>
            <div className="settings-form-grid">
              <TextField
                label="Display brand name"
                value={settingsDisplayText(data.brand_identity.display_name)}
                disabled
                readOnly
              />
              <TextField
                label="Parent website URL"
                value={websiteUrl}
                disabled
                readOnly
              />
            </div>
          </div>
          <Alert tone="warning" title="Protected Brand identity">
            Brand name and website are read-only in General settings. Changing
            the organization legal name does not change your Brand identity.
          </Alert>
        </SettingsSectionCard>
        <SettingsSectionCard
          title="Team management"
          description="Provision platform operational access rights, manage invited seats, and review inbound team join requests."
        >
          <BrandTeamSettings
            data={data}
            inviteMember={inviteMember}
            revokeMember={revokeMember}
            cancelInvitation={cancelInvitation}
            changeRole={changeRole}
          />
        </SettingsSectionCard>
      </div>
      <SettingsUnsavedBar
        visible={isDirty}
        onDiscard={resetForm}
        onSave={() => void handleSave()}
        saveDisabled={saving || !canEditOrg}
      />
    </>
  );
}
