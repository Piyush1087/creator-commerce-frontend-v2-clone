import { useState } from "react";

import { Alert, Badge, Button, TextField } from "../../../../design-system/aurora";
import { SideDrawer } from "../../../../design-system/aurora/components/SideDrawer";
import type { BrandWithdrawalAccountResponse } from "../../contracts/brand-settings.contracts";
import { settingsDisplayText } from "../../utils/brand-settings-display";
import { SettingsSectionCard } from "../settings-section-card";

type BrandWithdrawalAccountSectionProps = {
  data: BrandWithdrawalAccountResponse | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  onSave: (payload: {
    beneficiaryName: string;
    bankName: string;
    accountNumber: string;
    confirmAccountNumber: string;
    ifscCode: string;
  }) => Promise<void>;
};

export function BrandWithdrawalAccountSection({
  data,
  loading,
  saving,
  error,
  onSave,
}: BrandWithdrawalAccountSectionProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [confirmAccountNumber, setConfirmAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [verified, setVerified] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const account = data?.withdrawal_account;
  const readOnly = data?.is_read_only ?? false;

  const openDrawer = () => {
    setBeneficiaryName(account?.beneficiary_name ?? "");
    setBankName(account?.bank_name ?? "");
    setAccountNumber("");
    setConfirmAccountNumber("");
    setIfscCode(account?.ifsc_code ?? "");
    setVerified(false);
    setFormError(null);
    setDrawerOpen(true);
  };

  const handleSubmit = async () => {
    if (accountNumber !== confirmAccountNumber) {
      setFormError("Bank account inputs do not match.");
      return;
    }
    if (!verified) {
      setFormError("Verify that this account is legally authorized to receive funds.");
      return;
    }
    setFormError(null);
    try {
      await onSave({
        beneficiaryName: beneficiaryName.trim(),
        bankName: bankName.trim(),
        accountNumber,
        confirmAccountNumber,
        ifscCode: ifscCode.trim().toUpperCase(),
      });
      setDrawerOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to link withdrawal account.");
    }
  };

  const accountEnding = account?.account_last_4
    ? `••••${account.account_last_4}`
    : settingsDisplayText(null);

  return (
    <>
      <SettingsSectionCard
        title="Reverse payout & escrow withdrawal beneficiary"
        description="Configure the verified bank account used to return escrow funds when contracts terminate or fail compliance checks."
      >
        {error ? (
          <Alert tone="error" title="Withdrawal account unavailable">
            {error}
          </Alert>
        ) : null}
        {loading && !data ? (
          <p className="cc-muted">Loading withdrawal configuration…</p>
        ) : (
          <div className="settings-bank-node">
            <div>
              <div className="settings-bank-node__header">
                <h3>{settingsDisplayText(account?.bank_name)}</h3>
                {account?.is_verified ? (
                  <Badge tone="success">Verified payout destination</Badge>
                ) : (
                  <Badge tone="neutral">Not linked</Badge>
                )}
              </div>
              <p>{settingsDisplayText(account?.beneficiary_name)}</p>
              <p className="settings-bank-node__masked">
                Account ending in {accountEnding} • IFSC:{" "}
                {settingsDisplayText(account?.ifsc_code)}
              </p>
            </div>
            <button
              type="button"
              className="settings-team__action-link"
              disabled={readOnly}
              onClick={openDrawer}
            >
              {account ? "Replace account details" : "Link secure account"}
            </button>
          </div>
        )}
        {readOnly ? (
          <p className="settings-team__capacity-warning">
            Read-only: contact a Finance Admin to configure withdrawal accounts.
          </p>
        ) : null}
      </SettingsSectionCard>

      <SideDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Secure reverse withdrawal node"
        subtitle="Funds return to this beneficiary when escrow releases back to the brand."
        width="460px"
        footer={
          <div className="settings-drawer-footer">
            <Button variant="ghost" onClick={() => setDrawerOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" disabled={saving || readOnly} onClick={() => void handleSubmit()}>
              {saving ? "Linking…" : "Link secure account"}
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
            label="Legal beneficiary name"
            value={beneficiaryName}
            onChange={(e) => setBeneficiaryName(e.target.value)}
          />
          <TextField
            label="Target bank institution label"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
          />
          <TextField
            label="Corporate routing number input"
            type="password"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
          />
          <TextField
            label="Confirm account routing number"
            type="password"
            value={confirmAccountNumber}
            onChange={(e) => setConfirmAccountNumber(e.target.value)}
          />
          <TextField
            label="Indian bank routing IFSC code standard"
            value={ifscCode}
            onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
            placeholder={settingsDisplayText(null)}
          />
          <label className="settings-modal__confirm">
            <input
              type="checkbox"
              checked={verified}
              onChange={(e) => setVerified(e.target.checked)}
            />
            <span>I verify this account is legally authorized to receive funds.</span>
          </label>
        </div>
      </SideDrawer>
    </>
  );
}
