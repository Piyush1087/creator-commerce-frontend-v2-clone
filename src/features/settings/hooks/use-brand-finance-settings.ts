import { useCallback, useEffect, useState } from "react";

import {
  fetchBrandBillingProfile,
  fetchBrandNotifications,
  fetchBrandWithdrawalAccount,
  linkBrandWithdrawalAccount,
  updateBrandNotifications,
  upsertBrandBillingProfile,
} from "../api/brand-settings-client";
import type {
  BrandBillingProfileResponse,
  BrandNotificationsResponse,
  BrandWithdrawalAccountResponse,
  LinkBrandWithdrawalAccountPayload,
  UpdateBrandNotificationsPayload,
  UpsertBrandBillingProfilePayload,
} from "../contracts/brand-settings.contracts";

export function useBrandFinanceSettings() {
  const [billing, setBilling] = useState<BrandBillingProfileResponse | null>(null);
  const [withdrawal, setWithdrawal] = useState<BrandWithdrawalAccountResponse | null>(null);
  const [notifications, setNotifications] = useState<BrandNotificationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [billingResponse, withdrawalResponse, notificationsResponse] = await Promise.all([
        fetchBrandBillingProfile(),
        fetchBrandWithdrawalAccount(),
        fetchBrandNotifications(),
      ]);
      setBilling(billingResponse);
      setWithdrawal(withdrawalResponse);
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

  const saveWithdrawalAccount = useCallback(
    async (payload: LinkBrandWithdrawalAccountPayload) => {
      setSaving(true);
      setError(null);
      try {
        await linkBrandWithdrawalAccount(payload);
        await reload();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to link withdrawal account.";
        setError(message);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [reload],
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
    withdrawal,
    notifications,
    loading,
    saving,
    error,
    reload,
    saveBillingProfile,
    saveWithdrawalAccount,
    saveNotifications,
  };
}
