import { useCallback, useEffect, useState } from "react";

import {
  fetchCreatorCanonicalProfile,
  fetchCreatorDefaultContact,
  updateCreatorCanonicalProfile,
  upsertCreatorDefaultContact,
} from "../api/creator-profile-contact-client";
import type {
  CreatorCanonicalProfileResponse,
  CreatorDefaultContactResponse,
  UpdateCreatorCanonicalProfilePayload,
  UpsertCreatorDefaultContactPayload,
} from "../contracts/creator-profile-contact.contracts";

export function useCreatorProfileContactSettings() {
  const [profile, setProfile] =
    useState<CreatorCanonicalProfileResponse | null>(null);
  const [contact, setContact] = useState<CreatorDefaultContactResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [profileResponse, contactResponse] = await Promise.all([
        fetchCreatorCanonicalProfile(),
        fetchCreatorDefaultContact(),
      ]);
      setProfile(profileResponse);
      setContact(contactResponse);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Creator profile and contact settings are unavailable.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const save = useCallback(
    async (payload: {
      profile?: UpdateCreatorCanonicalProfilePayload;
      contact?: UpsertCreatorDefaultContactPayload;
    }) => {
      setSaving(true);
      setError(null);
      try {
        if (payload.profile) {
          setProfile(await updateCreatorCanonicalProfile(payload.profile));
        }
        if (payload.contact) {
          setContact(await upsertCreatorDefaultContact(payload.contact));
        }
        await reload();
      } catch (reason) {
        const message =
          reason instanceof Error
            ? reason.message
            : "Settings could not be saved.";
        setError(message);
        throw reason;
      } finally {
        setSaving(false);
      }
    },
    [reload],
  );

  return { profile, contact, loading, saving, error, reload, save };
}
