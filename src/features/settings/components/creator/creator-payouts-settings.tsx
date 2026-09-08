import { useState } from "react";

import { Loader2 } from "lucide-react";

import { Link } from "react-router-dom";

import {
  Alert,
  Badge,
  Button,
  TextField,
} from "../../../../design-system/aurora";

import { SideDrawer } from "../../../../design-system/aurora/components/SideDrawer";

import { AUTH_ROUTES } from "../../../auth/constants";

import { useCreatorPayoutsSettings } from "../../hooks/use-creator-payouts-settings";

import { settingsDisplayText } from "../../utils/creator-settings-display";

import { SettingsSectionCard } from "../settings-section-card";

export function CreatorPayoutsSettings() {
  const { settings, loading, saving, error, saveBank } =
    useCreatorPayoutsSettings();

  const [bankDrawerOpen, setBankDrawerOpen] = useState(false);

  const [beneficiaryName, setBeneficiaryName] = useState("");

  const [accountNumber, setAccountNumber] = useState("");

  const [confirmAccountNumber, setConfirmAccountNumber] = useState("");

  const [ifscCode, setIfscCode] = useState("");

  const [formError, setFormError] = useState<string | null>(null);

  const readOnly = settings?.is_read_only ?? false;

  const bank = settings?.bank_node;

  const settlement = settings?.settlement_profile;

  const currency = "INR";

  const openBankDrawer = () => {
    setBeneficiaryName(bank?.beneficiary_name ?? "");

    setAccountNumber("");

    setConfirmAccountNumber("");

    setIfscCode(bank?.ifsc_code ?? "");

    setFormError(null);

    setBankDrawerOpen(true);
  };

  const handleSaveBank = async () => {
    if (accountNumber !== confirmAccountNumber) {
      setFormError("Bank account inputs do not match.");

      return;
    }

    setFormError(null);

    try {
      await saveBank({
        beneficiaryLegalName: beneficiaryName.trim(),

        accountNumber,

        confirmAccountNumber,

        routingIfscSwift: ifscCode.trim().toUpperCase(),

        payoutCurrencyToken: currency,
      });

      setBankDrawerOpen(false);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to save bank account.",
      );
    }
  };

  if (loading && !settings) {
    return (
      <div className="settings-page-stack settings-page-stack--centered">
        <Loader2 size={28} className="brand-escrow-spin" aria-hidden />

        <p className="cc-muted">Loading payout settings…</p>
      </div>
    );
  }

  return (
    <>
      {error ? (
        <Alert tone="error" title="Payout settings unavailable">
          {error}
        </Alert>
      ) : null}

      <div className="settings-page-stack">
        <SettingsSectionCard
          title="Local bank payout node"
          description="Configure your destination checking account to receive direct electronic fund transfers (NEFT / RTGS / IMPS)."
        >
          <div className="settings-bank-node">
            <div>
              <div className="settings-bank-node__header">
                <h3>{settingsDisplayText(bank?.bank_name)}</h3>

                {bank ? (
                  <Badge
                    tone={
                      bank.verification_status === "VERIFIED"
                        ? "success"
                        : bank.verification_status === "SUSPENDED"
                          ? "error"
                          : "pending"
                    }
                  >
                    {bank.verification_status === "VERIFIED"
                      ? "Verified active node"
                      : settingsDisplayText(bank.verification_status)}
                  </Badge>
                ) : (
                  <Badge tone="neutral">Not linked</Badge>
                )}
              </div>

              <p>{settingsDisplayText(bank?.beneficiary_name)}</p>

              <p className="settings-bank-node__masked">
                Account ending in{" "}
                {bank?.account_last_4
                  ? `••••${bank.account_last_4}`
                  : settingsDisplayText(null)}{" "}
                • IFSC: {settingsDisplayText(bank?.ifsc_code)}
              </p>
            </div>

            <button
              type="button"
              className="settings-team__action-link"
              disabled={readOnly}
              onClick={openBankDrawer}
            >
              {bank ? "Replace account details" : "Configure payout account"}
            </button>
          </div>

          {readOnly ? (
            <p className="settings-team__capacity-warning">
              Read-only: contact a workspace owner or manager to update payout
              accounts.
            </p>
          ) : null}
        </SettingsSectionCard>

        <SettingsSectionCard
          title="Tax compliance & invoices"
          description="Keep your permanent account numbers updated and access automated tax invoices for completed campaigns."
        >
          <div className="settings-tax-row">
            <div>
              <p className="settings-tax-row__label">
                Permanent account number (PAN)
              </p>

              {settlement?.is_pan_verified ? (
                <Badge tone="success">Verified active compliance file</Badge>
              ) : (
                <Badge tone="neutral">{settingsDisplayText(null)}</Badge>
              )}

              <p className="settings-tax-row__masked">
                PAN record: {settingsDisplayText(settlement?.pan_masked)}
              </p>
            </div>

            <Link
              to={AUTH_ROUTES.creatorPayouts}
              className="settings-team__action-link"
            >
              Open invoice vault (PDF downloads)
            </Link>
          </div>
        </SettingsSectionCard>

        <SettingsSectionCard
          title="Premium tier creator infrastructure (forthcoming)"
          description="Build integrated paid subscription tiers directly into your media kit profile."
          className="settings-roadmap-card"
        >
          <Badge tone="pending">Future platform extension — Q4 2026</Badge>

          <Button variant="outline" disabled>
            Feature access locked
          </Button>
        </SettingsSectionCard>
      </div>

      <SideDrawer
        isOpen={bankDrawerOpen}
        onClose={() => setBankDrawerOpen(false)}
        title="Configure payout account"
        subtitle="The system will verify routing data with a small tracking deposit before large distributions."
        width="460px"
        footer={
          <div className="settings-drawer-footer">
            <Button
              variant="ghost"
              onClick={() => setBankDrawerOpen(false)}
              disabled={saving}
            >
              Cancel selection
            </Button>

            <Button
              variant="primary"
              disabled={saving || readOnly}
              onClick={() => void handleSaveBank()}
            >
              {saving ? "Saving…" : "Securely save payout account"}
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
            label="Beneficiary legal name"
            value={beneficiaryName}
            onChange={(e) => setBeneficiaryName(e.target.value)}
          />

          <TextField
            label="Bank account number"
            type="password"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
          />

          <TextField
            label="Confirm bank account number"
            type="password"
            value={confirmAccountNumber}
            onChange={(e) => setConfirmAccountNumber(e.target.value)}
          />

          <TextField
            label="IFSC / routing identifier"
            value={ifscCode}
            placeholder={settingsDisplayText(null)}
            onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
          />
        </div>
      </SideDrawer>
    </>
  );
}
