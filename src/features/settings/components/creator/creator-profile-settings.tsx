import { useEffect, useMemo, useState } from "react";

import { CloudUpload, Loader2 } from "lucide-react";



import { Alert, Button, TextField } from "../../../../design-system/aurora";

import { SideDrawer } from "../../../../design-system/aurora/components/SideDrawer";

import type { CreatorTeamRole } from "../../contracts/creator-settings.contracts";

import { useCreatorProfileSettings } from "../../hooks/use-creator-profile-settings";

import {

  isCreatorAssistantReadOnly,

  isCreatorWorkspaceAdmin,

  mapCreatorTeamRows,

  settingsDisplayText,

  shippingFormFromApi,

} from "../../utils/creator-settings-display";

import { SettingsSectionCard } from "../settings-section-card";

import { SettingsTeamTable } from "../settings-team-table";

import { SettingsUnsavedBar } from "../settings-unsaved-bar";



const INVITE_ROLES: Array<{ value: CreatorTeamRole; label: string }> = [

  { value: "OWNER", label: "Owner — full administrative and payout access" },

  { value: "MANAGER", label: "Manager — all access except channel deletion" },

  { value: "ASSISTANT", label: "Assistant — read-only workspace access" },

];



type ProfileForm = {

  firstName: string;

  lastName: string;

  workspaceName: string;

  shipping: ReturnType<typeof shippingFormFromApi>;

};



function buildForm(

  profile: NonNullable<ReturnType<typeof useCreatorProfileSettings>["profile"]>,

  shipping: NonNullable<ReturnType<typeof useCreatorProfileSettings>["shipping"]>,

  workspace: NonNullable<ReturnType<typeof useCreatorProfileSettings>["workspace"]>,

): ProfileForm {

  return {

    firstName: profile.profile.first_name ?? "",

    lastName: profile.profile.last_name ?? "",

    workspaceName: workspace.workspace.organization_display_name ?? "",

    shipping: shippingFormFromApi(shipping.shipping_address),

  };

}



export function CreatorProfileSettings() {

  const {

    profile,

    shipping,

    workspace,

    loading,

    saving,

    error,

    saveAll,

    inviteMember,

    revokeMember,

    cancelInvitation,

  } = useCreatorProfileSettings();



  const [form, setForm] = useState<ProfileForm | null>(null);

  const [passwordOpen, setPasswordOpen] = useState(false);

  const [inviteOpen, setInviteOpen] = useState(false);

  const [inviteEmail, setInviteEmail] = useState("");

  const [inviteRole, setInviteRole] = useState<CreatorTeamRole>("MANAGER");

  const [inviteBusy, setInviteBusy] = useState(false);

  const [revokeTarget, setRevokeTarget] = useState<string | null>(null);

  const [revokeConfirmed, setRevokeConfirmed] = useState(false);

  const [revokeBusy, setRevokeBusy] = useState(false);

  const [actionError, setActionError] = useState<string | null>(null);



  useEffect(() => {

    if (profile && shipping && workspace) {

      setForm(buildForm(profile, shipping, workspace));

    }

  }, [profile, shipping, workspace]);



  const baseline = useMemo(

    () => (profile && shipping && workspace ? buildForm(profile, shipping, workspace) : null),

    [profile, shipping, workspace],

  );



  const isDirty =

    form !== null &&

    baseline !== null &&

    (form.firstName !== baseline.firstName ||

      form.lastName !== baseline.lastName ||

      form.workspaceName !== baseline.workspaceName ||

      JSON.stringify(form.shipping) !== JSON.stringify(baseline.shipping));



  const role = workspace?.current_user_role ?? profile?.current_user_role ?? "ASSISTANT";

  const readOnly = isCreatorAssistantReadOnly(role);

  const canManageTeam = isCreatorWorkspaceAdmin(role);

  const seatUsage = workspace?.team.seat_usage;

  const atCapacity = seatUsage?.is_at_capacity ?? false;

  const teamRows = workspace ? mapCreatorTeamRows(workspace) : [];



  const resetForm = () => {

    if (baseline) {

      setForm(baseline);

    }

  };



  const handleSave = async () => {
    if (!form || !baseline || readOnly) {
      return;
    }
    setActionError(null);
    try {
      const payload: Parameters<typeof saveAll>[0] = {};

      if (form.firstName !== baseline.firstName || form.lastName !== baseline.lastName) {
        payload.profile = {
          firstName: form.firstName.trim() || undefined,
          lastName: form.lastName.trim() || undefined,
        };
      }

      if (form.workspaceName !== baseline.workspaceName) {
        payload.workspaceName = form.workspaceName.trim();
      }

      if (JSON.stringify(form.shipping) !== JSON.stringify(baseline.shipping)) {
        payload.shipping = {
          recipientLegalName: form.shipping.recipientLegalName.trim(),
          streetAddressLine1: form.shipping.streetAddressLine1.trim(),
          streetAddressLine2: form.shipping.streetAddressLine2.trim() || null,
          city: form.shipping.city.trim(),
          stateProvince: form.shipping.stateProvince.trim(),
          postalCodeZip: form.shipping.postalCodeZip.trim(),
          countryIsoCode: form.shipping.countryIsoCode.trim().toUpperCase() || "IN",
          deliveryInstructionsNarrative: form.shipping.deliveryInstructions.trim() || null,
          isPrimaryDestination: true,
        };
      }

      if (Object.keys(payload).length === 0) {
        return;
      }

      await saveAll(payload);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to save profile.");
    }
  };



  const handleInvite = async () => {

    setInviteBusy(true);

    setActionError(null);

    try {

      await inviteMember({ recipientEmail: inviteEmail.trim(), allocatedRole: inviteRole });

      setInviteOpen(false);

      setInviteEmail("");

      setInviteRole("MANAGER");

    } catch (err) {

      setActionError(err instanceof Error ? err.message : "Failed to send invitation.");

    } finally {

      setInviteBusy(false);

    }

  };



  const handleRevoke = async () => {

    if (!revokeTarget || !revokeConfirmed) {

      return;

    }

    setRevokeBusy(true);

    setActionError(null);

    try {

      await revokeMember(revokeTarget);

      setRevokeTarget(null);

      setRevokeConfirmed(false);

    } catch (err) {

      setActionError(err instanceof Error ? err.message : "Failed to revoke access.");

    } finally {

      setRevokeBusy(false);

    }

  };



  if (loading && !profile) {

    return (

      <div className="settings-page-stack settings-page-stack--centered">

        <Loader2 size={28} className="brand-escrow-spin" aria-hidden />

        <p className="cc-muted">Loading creator settings…</p>

      </div>

    );

  }



  if (!profile || !shipping || !workspace || !form) {

    return (

      <Alert tone="error" title="Could not load settings">

        {error ?? "Creator settings are unavailable right now."}

      </Alert>

    );

  }



  return (

    <>

      {error || actionError ? (

        <Alert tone="error" title="Settings action failed">

          {actionError ?? error}

        </Alert>

      ) : null}



      <div className="settings-page-stack">

        <SettingsSectionCard

          title="Creator profile"

          description="Update your public identification details, legal name, and profile image."

        >

          <div className="settings-profile-grid">

            <div className="settings-avatar-upload settings-avatar-upload--image">

              {profile.profile.avatar_url ? (

                <img src={profile.profile.avatar_url} alt="" />

              ) : (

                <CloudUpload size={28} aria-hidden />

              )}

              <div className="settings-avatar-upload__overlay">

                <CloudUpload size={22} aria-hidden />

                <p>Drag &amp; drop an image or click to browse. Max size: 2MB.</p>

              </div>

            </div>

            <div className="settings-form-grid">

              <TextField

                label="First name"

                value={form.firstName}

                placeholder={settingsDisplayText(null)}

                disabled={readOnly}

                onChange={(e) => setForm((f) => f && { ...f, firstName: e.target.value })}

              />

              <TextField

                label="Last name"

                value={form.lastName}

                placeholder={settingsDisplayText(null)}

                disabled={readOnly}

                onChange={(e) => setForm((f) => f && { ...f, lastName: e.target.value })}

              />

              <div className="settings-form-grid__full">

                <TextField

                  label="Account email address"

                  value={settingsDisplayText(profile.profile.email)}

                  readOnly

                  disabled

                  helperText="Email modifications are disabled. Contact support to initiate identity routing changes."

                />

              </div>

              <div className="settings-form-grid__full">

                <TextField

                  label="Primary region"

                  value={settingsDisplayText(profile.profile.primary_region)}

                  readOnly

                  disabled

                />

              </div>

            </div>

          </div>

        </SettingsSectionCard>



        <SettingsSectionCard

          title="Login security"

          description="Manage the authentication password used to access your secure creative workspace."

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

              <TextField label="Current security password" type="password" disabled />

              <TextField label="New account password" type="password" disabled />

              <TextField label="Confirm new account password" type="password" disabled />

            </div>

          ) : null}

        </SettingsSectionCard>



        <SettingsSectionCard

          title="Shipping logistics"

          description="Provide your verified shipping address to receive physical product samples and campaign merchandise."

        >

          <div className="settings-form-grid settings-form-grid--two">

            <div className="settings-form-grid__full">

              <TextField

                label="Recipient legal name"

                value={form.shipping.recipientLegalName}

                placeholder={settingsDisplayText(null)}

                disabled={readOnly}

                onChange={(e) =>

                  setForm((f) =>

                    f ? { ...f, shipping: { ...f.shipping, recipientLegalName: e.target.value } } : f,

                  )

                }

              />

            </div>

            <TextField

              label="Street address line 1"

              value={form.shipping.streetAddressLine1}

              placeholder={settingsDisplayText(null)}

              disabled={readOnly}

              onChange={(e) =>

                setForm((f) =>

                  f

                    ? { ...f, shipping: { ...f.shipping, streetAddressLine1: e.target.value } }

                    : f,

                )

              }

            />

            <TextField

              label="Street address line 2 (optional)"

              value={form.shipping.streetAddressLine2}

              placeholder={settingsDisplayText(null)}

              disabled={readOnly}

              onChange={(e) =>

                setForm((f) =>

                  f

                    ? { ...f, shipping: { ...f.shipping, streetAddressLine2: e.target.value } }

                    : f,

                )

              }

            />

            <TextField

              label="City"

              value={form.shipping.city}

              placeholder={settingsDisplayText(null)}

              disabled={readOnly}

              onChange={(e) =>

                setForm((f) =>

                  f ? { ...f, shipping: { ...f.shipping, city: e.target.value } } : f,

                )

              }

            />

            <TextField

              label="State / province"

              value={form.shipping.stateProvince}

              placeholder={settingsDisplayText(null)}

              disabled={readOnly}

              onChange={(e) =>

                setForm((f) =>

                  f ? { ...f, shipping: { ...f.shipping, stateProvince: e.target.value } } : f,

                )

              }

            />

            <TextField

              label="Postal code / ZIP"

              value={form.shipping.postalCodeZip}

              placeholder={settingsDisplayText(null)}

              disabled={readOnly}

              onChange={(e) =>

                setForm((f) =>

                  f ? { ...f, shipping: { ...f.shipping, postalCodeZip: e.target.value } } : f,

                )

              }

            />

            <TextField

              label="Country (ISO)"

              value={form.shipping.countryIsoCode}

              placeholder={settingsDisplayText(null)}

              maxLength={2}

              disabled={readOnly}

              onChange={(e) =>

                setForm((f) =>

                  f

                    ? {

                        ...f,

                        shipping: { ...f.shipping, countryIsoCode: e.target.value.toUpperCase() },

                      }

                    : f,

                )

              }

            />

            <div className="settings-form-grid__full">

              <TextField

                label="Delivery instructions (optional)"

                multiline

                rows={3}

                value={form.shipping.deliveryInstructions}

                placeholder={settingsDisplayText(null)}

                disabled={readOnly}

                onChange={(e) =>

                  setForm((f) =>

                    f

                      ? { ...f, shipping: { ...f.shipping, deliveryInstructions: e.target.value } }

                      : f,

                  )

                }

              />

            </div>

          </div>

        </SettingsSectionCard>



        <hr className="settings-section-divider" />



        <SettingsSectionCard

          title="Organization details"

          description="Configure the operational identity for your production team or management agency."

        >

          <TextField

            label="Organization name"

            value={form.workspaceName}

            placeholder={settingsDisplayText(null)}

            disabled={readOnly}

            onChange={(e) => setForm((f) => f && { ...f, workspaceName: e.target.value })}

          />

        </SettingsSectionCard>



        <SettingsSectionCard

          title="Team management"

          description="Provision platform access rights, manage invited team seats, and review agency join requests."

        >

          <SettingsTeamTable

            members={teamRows}

            maxSeats={seatUsage?.max_seats ?? 5}

            inviteDisabled={!canManageTeam || atCapacity}

            inviteDisabledReason={

              atCapacity

                ? "Workspace seat capacity fully exhausted."

                : !canManageTeam

                  ? "Only workspace owners and managers can invite team members."

                  : undefined

            }

            onInvite={() => setInviteOpen(true)}

            onRevoke={canManageTeam ? (id) => setRevokeTarget(id) : undefined}

            onCancelInvite={canManageTeam ? (id) => void cancelInvitation(id) : undefined}

          />

        </SettingsSectionCard>

      </div>



      <SettingsUnsavedBar

        visible={isDirty}

        message="Unsaved core workspace modifications detected"

        saveLabel="Save profile changes"

        saveDisabled={saving || readOnly}

        onDiscard={resetForm}

        onSave={() => void handleSave()}

      />



      <SideDrawer

        isOpen={inviteOpen}

        onClose={() => setInviteOpen(false)}

        title="Invite team member"

        subtitle="Provision secure workspace access to production assistants or external management partners."

        width="460px"

        footer={

          <div className="settings-drawer-footer">

            <Button variant="ghost" onClick={() => setInviteOpen(false)} disabled={inviteBusy}>

              Cancel &amp; close

            </Button>

            <Button

              variant="primary"

              disabled={!inviteEmail.includes("@") || inviteBusy}

              onClick={() => void handleInvite()}

            >

              {inviteBusy ? "Sending…" : "Dispatch safe invite code"}

            </Button>

          </div>

        }

      >

        <div className="settings-drawer-body">

          <TextField

            label="Target recipient email address"

            value={inviteEmail}

            onChange={(e) => setInviteEmail(e.target.value)}

          />

          <fieldset className="settings-role-fieldset">

            <legend>Workspace role assignment</legend>

            {INVITE_ROLES.map((roleOption) => (

              <label key={roleOption.value} className="settings-role-option">

                <input

                  type="radio"

                  name="creator-invite-role"

                  value={roleOption.value}

                  checked={inviteRole === roleOption.value}

                  onChange={() => setInviteRole(roleOption.value)}

                />

                <span>{roleOption.label}</span>

              </label>

            ))}

          </fieldset>

        </div>

      </SideDrawer>



      {revokeTarget ? (

        <div className="settings-modal-overlay" role="presentation">

          <div className="settings-modal" role="dialog">

            <h3>Terminate workspace access authorization?</h3>

            <p>

              You are about to revoke operational permissions for this seat. Historical campaign

              logs remain preserved.

            </p>

            <label className="settings-modal__confirm">

              <input

                type="checkbox"

                checked={revokeConfirmed}

                onChange={(e) => setRevokeConfirmed(e.target.checked)}

              />

              <span>I verify that I have authority to revoke this user seat.</span>

            </label>

            <div className="settings-modal__actions">

              <Button

                variant="ghost"

                onClick={() => {

                  setRevokeTarget(null);

                  setRevokeConfirmed(false);

                }}

                disabled={revokeBusy}

              >

                Cancel and retain user seat

              </Button>

              <Button

                variant="primary"

                disabled={!revokeConfirmed || revokeBusy}

                onClick={() => void handleRevoke()}

              >

                {revokeBusy ? "Revoking…" : "Confirm access termination"}

              </Button>

            </div>

          </div>

        </div>

      ) : null}

    </>

  );

}


