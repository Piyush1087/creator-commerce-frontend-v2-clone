import { useCallback, useEffect, useState } from "react";

import {
  fetchBrandBillingProfile,
  fetchBrandNotifications,
  updateBrandNotifications,
  upsertBrandBillingProfile,
} from "../api/brand-settings-client";
import type {
  BrandBillingProfileResponse,
  BrandNotificationsResponse,
  UpdateBrandNotificationsPayload,
  UpsertBrandBillingProfilePayload,
} from "../contracts/brand-settings.contracts";

export function useBrandFinanceSettings() {
  const [billing, setBilling] = useState<BrandBillingProfileResponse | null>(null);
  const [notifications, setNotifications] = useState<BrandNotificationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [billingResponse, notificationsResponse] = await Promise.all([
        fetchBrandBillingProfile(),
        fetchBrandNotifications(),
      ]);
      setBilling(billingResponse);
      setNotifications(notificationsResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load finance settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const saveBillingProfile = useCallback(
    async (payload: UpsertBrandBillingProfilePayload) => {
      setSaving(true);
      setError(null);
      try {
        const response = await upsertBrandBillingProfile(payload);
        setBilling(response);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to save billing profile.";
        setError(message);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  const saveNotifications = useCallback(
    async (payload: UpdateBrandNotificationsPayload) => {
      setSaving(true);
      setError(null);
      try {
        const response = await updateBrandNotifications(payload);
        setNotifications(response);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to save notifications.";
        setError(message);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  return {
    billing,
    notifications,
    loading,
    saving,
    error,
    reload,
    saveBillingProfile,
    saveNotifications,
  };
}
