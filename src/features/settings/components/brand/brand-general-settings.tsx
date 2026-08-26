import { useEffect, useMemo, useState } from "react";

import { CloudUpload, Loader2 } from "lucide-react";



import { Alert, Button, TextField } from "../../../../design-system/aurora";



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

  address: string;

  countryCode: string;

  currencyCode: string;

  taxId: string;

};



function formFromApi(data: NonNullable<ReturnType<typeof useBrandGeneralSettings>["data"]>): FormState {

  return {

    firstName: data.personal_profile.first_name ?? "",

    lastName: data.personal_profile.last_name ?? "",

    companyName: data.organization.company_legal_name ?? "",

    address: data.organization.corporate_address ?? "",

    countryCode: data.organization.country_code ?? "",

    currencyCode: data.organization.currency_code ?? "",

    taxId: data.organization.tax_id ?? "",

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

  const [passwordOpen, setPasswordOpen] = useState(false);

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

      form.companyName !== baseline.companyName ||

      form.address !== baseline.address ||

      form.countryCode !== baseline.countryCode ||

      form.currencyCode !== baseline.currencyCode ||

      form.taxId !== baseline.taxId);



  const canEditOrg = data ? data.current_user_role !== "CAMPAIGN_MANAGER" : false;

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

        countryCode: form.countryCode.trim().length === 2 ? form.countryCode.trim() : undefined,

        currencyCode: form.currencyCode.trim().length === 3 ? form.currencyCode.trim() : undefined,

      });

    } catch (err) {

      setActionError(err instanceof Error ? err.message : "Failed to save changes.");

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

          description="Update your personal identification details and profile image."

        >

          <div className="settings-profile-grid">

            <div className="settings-avatar-upload" aria-label="Profile image upload">

              {data.personal_profile.avatar_url ? (

                <img src={data.personal_profile.avatar_url} alt="" />

              ) : (

                <CloudUpload size={28} aria-hidden />

              )}

              <p>Drag &amp; drop an image or click to browse. Max size: 2MB (JPEG, PNG).</p>

            </div>

            <div className="settings-form-grid">

              <TextField

                label="First name"

                value={form.firstName}

                placeholder={displayFieldValue("")}

                onChange={(e) => setForm((f) => f && { ...f, firstName: e.target.value })}

              />

              <TextField

                label="Last name"

                value={form.lastName}

                placeholder={displayFieldValue("")}

                onChange={(e) => setForm((f) => f && { ...f, lastName: e.target.value })}

              />

              <div className="settings-form-grid__full">

                <TextField

                  label="Account email address"

                  value={settingsDisplayText(data.personal_profile.email)}

                  readOnly

                  disabled

                  helperText="Email address modifications are disabled. Contact system support to initiate identity routing changes."

                />

              </div>

            </div>

          </div>

        </SettingsSectionCard>



        <SettingsSectionCard

          title="Login security"

          description="Manage the authentication password used to access your secure workspace."

        >

          <div className="settings-security-row">

            <div>

              <p className="settings-security-row__label">Password</p>

              <p className="settings-security-row__masked">••••••••••••••••</p>

            </div>

            <Button variant="outline" onClick={() => setPasswordOpen((v) => !v)}>

              Update password

            </Button>

          </div>

          {passwordOpen ? (

            <div className="settings-password-drawer-inline">

              <TextField label="Current security password" type="password" />

              <TextField label="New workspace password" type="password" />

              <TextField label="Confirm new workspace password" type="password" />

              <div className="settings-password-drawer-inline__actions">

                <Button variant="ghost" onClick={() => setPasswordOpen(false)}>

                  Close window

                </Button>

                <Button variant="primary" disabled>

                  Commit security update

                </Button>

              </div>

            </div>

          ) : null}

        </SettingsSectionCard>



        <hr className="settings-section-divider" />



        <SettingsSectionCard

          title="Organization details"

          description="Configure the legal billing identity, default workspace currency, and corporate tax tracking infrastructure."

        >

          <div className="settings-form-grid settings-form-grid--two">

            <TextField

              label="Company legal name"

              value={form.companyName}

              placeholder={displayFieldValue("")}

              disabled={!canEditOrg}

              onChange={(e) => setForm((f) => f && { ...f, companyName: e.target.value })}

            />

            <TextField

              label="Corporate address line"

              value={form.address}

              placeholder={settingsDisplayText(null)}

              disabled={!canEditOrg}

              helperText="Corporate address sync is not yet stored on this workspace."

              onChange={(e) => setForm((f) => f && { ...f, address: e.target.value })}

            />

            <TextField

              label="Country location (ISO)"

              value={form.countryCode}

              placeholder={settingsDisplayText(null)}

              disabled={!canEditOrg}

              maxLength={2}

              onChange={(e) =>

                setForm((f) => f && { ...f, countryCode: e.target.value.toUpperCase() })

              }

            />

            <TextField

              label="Default operating currency (ISO)"

              value={form.currencyCode}

              placeholder={settingsDisplayText(null)}

              disabled={!canEditOrg}

              maxLength={3}

              helperText="This dictates the baseline ledger token mapping for campaign payouts."

              onChange={(e) =>

                setForm((f) => f && { ...f, currencyCode: e.target.value.toUpperCase() })

              }

            />

            <div className="settings-form-grid__full">

              <TextField

                label="Tax ID / VAT number"

                value={form.taxId}

                placeholder={settingsDisplayText(null)}

                disabled={!canEditOrg}

                helperText="Tax identifier sync is not yet stored on this workspace."

                onChange={(e) => setForm((f) => f && { ...f, taxId: e.target.value })}

              />

            </div>

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

          <Alert tone="warning" title="Workspace validation node">

            Initial account setup requires an exact domain match with your parent website URL (

            {websiteUrl}). Brand centre variables remain locked here to protect operational

            integrity.

          </Alert>

        </SettingsSectionCard>



        <SettingsSectionCard

          title="Team management"

          description="Provision platform operational access rights, manage invited seats, and review inbound team join requests."

        >

          <BrandTeamSettings data={data} inviteMember={inviteMember} revokeMember={revokeMember} cancelInvitation={cancelInvitation} changeRole={changeRole} />

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


