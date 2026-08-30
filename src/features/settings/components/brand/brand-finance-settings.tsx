import { Loader2 } from "lucide-react";

import { Alert } from "../../../../design-system/aurora";
import { useBrandFinanceSettings } from "../../hooks/use-brand-finance-settings";
import { BrandBillingProfileSection } from "./brand-billing-profile-section";
import { BrandNotificationsSection } from "./brand-notifications-section";

export function BrandFinanceSettings() {
  const {
    billing,
    notifications,
    loading,
    saving,
    error,
    saveBillingProfile,
    saveNotifications,
  } = useBrandFinanceSettings();

  if (loading && !billing && !notifications) {
    return (
      <div className="settings-page-stack settings-page-stack--centered">
        <Loader2 size={28} className="brand-escrow-spin" aria-hidden />
        <p className="cc-muted">Loading finance configuration…</p>
      </div>
    );
  }

  return (
    <div className="settings-page-stack">
      {error ? (
        <Alert tone="error" title="Finance settings partially unavailable">
          {error}
        </Alert>
      ) : null}

      <BrandBillingProfileSection
        data={billing}
        loading={loading}
        saving={saving}
        error={error}
        onSave={saveBillingProfile}
      />

      <BrandNotificationsSection
        data={notifications}
        loading={loading}
        saving={saving}
        error={error}
        onSave={saveNotifications}
      />
    </div>
  );
}
