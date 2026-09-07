import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import { Alert, TextField } from "../../../../design-system/aurora";
import { useCreatorProfileContactSettings } from "../../hooks/use-creator-profile-contact-settings";
import {
  buildCreatorProfileContactSavePayload,
  creatorProfileContactFormFromApi,
  type CreatorProfileContactForm,
} from "../../utils/creator-profile-contact-form";
import { SettingsSectionCard } from "../settings-section-card";
import { SettingsUnsavedBar } from "../settings-unsaved-bar";

export function CreatorProfileContactSettings() {
  const { profile, contact, loading, saving, error, save } =
    useCreatorProfileContactSettings();
  const [form, setForm] = useState<CreatorProfileContactForm | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (profile && contact) {
      setForm(creatorProfileContactFormFromApi(profile, contact));
    }
  }, [profile, contact]);

  const baseline = useMemo(
    () =>
      profile && contact
        ? creatorProfileContactFormFromApi(profile, contact)
        : null,
    [profile, contact],
  );
  const payload =
    form && baseline
      ? buildCreatorProfileContactSavePayload(form, baseline)
      : {};
  const dirty = Boolean(payload.profile || payload.contact);
  const canManageProfile =
    profile?.allowed_actions.includes("WORKSPACE_PROFILE_MANAGE") ?? false;
  const canManagePersonalName =
    canManageProfile && (profile?.can_manage_personal_name ?? false);
  const canManageContact =
    contact?.allowed_actions.includes("CONTACT_MANAGE") ?? false;

  const setField = <K extends keyof CreatorProfileContactForm>(
    key: K,
    value: CreatorProfileContactForm[K],
  ) => setForm((current) => (current ? { ...current, [key]: value } : current));

  const handleSave = async () => {
    if (!form || !baseline || !dirty) return;
    setActionError(null);
    try {
      await save({
        ...(canManageProfile && payload.profile
          ? {
              profile: {
                ...payload.profile,
                ...(!canManagePersonalName ? { userName: undefined } : {}),
              },
            }
          : {}),
        ...(canManageContact && payload.contact
          ? { contact: payload.contact }
          : {}),
      });
    } catch (reason) {
      setActionError(
        reason instanceof Error
          ? reason.message
          : "Settings could not be saved.",
      );
    }
  };

  if (loading && !profile) {
    return (
      <div
        className="settings-page-stack settings-page-stack--centered"
        role="status"
      >
        <Loader2 size={28} className="brand-escrow-spin" aria-hidden />
        <p className="cc-muted">Loading profile and contact settings…</p>
      </div>
    );
  }

  if (!profile || !contact || !form || !baseline) {
    return (
      <Alert tone="error" title="Profile and contact unavailable">
        {error ?? "Your Team role may not access Creator workspace settings."}
      </Alert>
    );
  }

  return (
    <div className="settings-page-stack creator-profile-contact">
      {error || actionError ? (
        <Alert tone="error" title="Settings action failed">
          {actionError ?? error}
        </Alert>
      ) : null}

      <SettingsSectionCard
        title="Creator profile"
        description="Canonical Creator identity. Account email remains read-only."
      >
        <div className="settings-form-grid">
          <TextField
            label="Account name"
            value={form.userName}
            maxLength={200}
            disabled={!canManagePersonalName}
            helperText={
              canManagePersonalName
                ? "This is your personal account name."
                : "Only the Owner can change their personal account name."
            }
            onChange={(event) => setField("userName", event.target.value)}
          />
          <TextField
            label="Creator display name"
            value={form.displayName}
            maxLength={100}
            disabled={!canManageProfile}
            onChange={(event) => setField("displayName", event.target.value)}
          />
          <TextField
            label="Account email"
            value={profile.profile.email}
            disabled
            readOnly
            helperText="Account email changes require support-assisted identity review."
          />
          <TextField
            label="Primary region (ISO country code)"
            value={form.primaryRegion}
            minLength={2}
            maxLength={2}
            autoCapitalize="characters"
            disabled={!canManageProfile}
            onChange={(event) => setField("primaryRegion", event.target.value)}
          />
          <div className="settings-form-grid__full">
            <TextField
              label="Avatar URL"
              type="url"
              value={form.avatarUrl}
              maxLength={2048}
              disabled={!canManageProfile}
              onChange={(event) => setField("avatarUrl", event.target.value)}
              helperText="Use an HTTPS image URL. Media upload infrastructure is unchanged."
            />
          </div>
        </div>
      </SettingsSectionCard>

      <SettingsSectionCard
        title="Workspace organization"
        description="This edits the canonical Organization name, not the legacy workspace display label."
      >
        <TextField
          label="Organization name"
          value={form.organizationName}
          minLength={2}
          maxLength={150}
          disabled={!canManageProfile}
          onChange={(event) => setField("organizationName", event.target.value)}
        />
      </SettingsSectionCard>

      <SettingsSectionCard
        title="Default shipping contact"
        description="Used as the canonical default contact. Collaboration-specific editing remains outside Settings."
      >
        {contact.default_contact?.has_legacy_unstructured_phone ? (
          <Alert tone="warning" title="Phone needs confirmation">
            A legacy phone value exists but was not inferred. Enter the calling
            code and national number to save a normalized contact.
          </Alert>
        ) : null}
        <div className="settings-form-grid">
          <TextField
            label="Recipient name"
            value={form.recipientName}
            maxLength={150}
            disabled={!canManageContact}
            onChange={(event) => setField("recipientName", event.target.value)}
          />
          <TextField
            label="Country (ISO code)"
            value={form.countryCode}
            minLength={2}
            maxLength={2}
            autoCapitalize="characters"
            disabled={!canManageContact}
            onChange={(event) => setField("countryCode", event.target.value)}
          />
          <div className="settings-form-grid__full">
            <TextField
              label="Address line 1"
              value={form.addressLine1}
              maxLength={255}
              disabled={!canManageContact}
              onChange={(event) => setField("addressLine1", event.target.value)}
            />
          </div>
          <div className="settings-form-grid__full">
            <TextField
              label="Address line 2"
              value={form.addressLine2}
              maxLength={255}
              disabled={!canManageContact}
              onChange={(event) => setField("addressLine2", event.target.value)}
            />
          </div>
          <TextField
            label="City"
            value={form.city}
            maxLength={120}
            disabled={!canManageContact}
            onChange={(event) => setField("city", event.target.value)}
          />
          <TextField
            label="State or region"
            value={form.stateRegion}
            maxLength={120}
            disabled={!canManageContact}
            onChange={(event) => setField("stateRegion", event.target.value)}
          />
          <TextField
            label="Postal code"
            value={form.postalCode}
            maxLength={32}
            autoComplete="postal-code"
            disabled={!canManageContact}
            onChange={(event) => setField("postalCode", event.target.value)}
          />
          <TextField
            label="Phone country calling code"
            value={form.phoneCountryCallingCode}
            maxLength={8}
            inputMode="tel"
            autoComplete="tel-country-code"
            placeholder="+91"
            disabled={!canManageContact}
            onChange={(event) =>
              setField("phoneCountryCallingCode", event.target.value)
            }
          />
          <TextField
            label="Phone national number"
            value={form.phoneNationalNumber}
            maxLength={32}
            inputMode="tel"
            autoComplete="tel-national"
            disabled={!canManageContact}
            onChange={(event) =>
              setField("phoneNationalNumber", event.target.value)
            }
          />
          <div className="settings-form-grid__full">
            <TextField
              multiline
              label="Delivery instructions"
              value={form.deliveryInstructions}
              maxLength={2000}
              rows={4}
              disabled={!canManageContact}
              onChange={(event) =>
                setField("deliveryInstructions", event.target.value)
              }
            />
          </div>
        </div>
      </SettingsSectionCard>

      <SettingsUnsavedBar
        visible={dirty}
        message="Unsaved profile or contact changes"
        onDiscard={() => setForm(baseline)}
        onSave={() => void handleSave()}
        saveLabel={saving ? "Saving…" : "Save settings"}
        saveDisabled={
          saving ||
          Boolean(payload.profile && !canManageProfile) ||
          Boolean(
            payload.profile?.userName !== undefined && !canManagePersonalName,
          ) ||
          Boolean(payload.contact && !canManageContact)
        }
      />
    </div>
  );
}
