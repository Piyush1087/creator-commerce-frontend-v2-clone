import { useState } from "react";

import {
  Alert,
  Button,
  SelectField,
  SideDrawer,
  TextField,
} from "../../../design-system/aurora";
import type {
  CreatorLegalProfile,
  CreatorPayeeType,
  CreatorPayoutDestination,
  CreatorPayoutDestinationType,
  CreatorPayoutDestinationWrite,
} from "../contracts/creator-payout-settings.contract";

type Props = {
  legalProfile: CreatorLegalProfile;
  destination: CreatorPayoutDestination | null;
  saving: boolean;
  onClose: () => void;
  onSave: (input: CreatorPayoutDestinationWrite) => Promise<void>;
};

const methodLabels: Record<CreatorPayoutDestinationType, string> = {
  BANK_ACCOUNT: "Bank account",
  UPI: "UPI",
  PAYPAL: "PayPal",
};

export function CreatorPayoutDestinationDrawer({
  legalProfile,
  destination,
  saving,
  onClose,
  onSave,
}: Props) {
  const country = legalProfile.country_code;
  const payeeType: CreatorPayeeType = legalProfile.payee_type;
  const [method, setMethod] = useState<CreatorPayoutDestinationType>(
    destination?.destination_type ?? "BANK_ACCOUNT",
  );
  const [beneficiaryName, setBeneficiaryName] = useState(
    destination?.beneficiary_name ?? legalProfile.legal_name,
  );
  const [accountNumber, setAccountNumber] = useState("");
  const [confirmAccountNumber, setConfirmAccountNumber] = useState("");
  const [routingCode, setRoutingCode] = useState("");
  const [upiId, setUpiId] = useState("");
  const [paypalEmail, setPaypalEmail] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const availableMethods: CreatorPayoutDestinationType[] =
    country === "IN" ? ["BANK_ACCOUNT", "UPI"] : ["BANK_ACCOUNT", "PAYPAL"];

  const save = async () => {
    if (!beneficiaryName.trim()) {
      setFormError("Enter the beneficiary legal name.");
      return;
    }
    let payload: CreatorPayoutDestinationWrite;
    if (method === "BANK_ACCOUNT") {
      if (!accountNumber || accountNumber !== confirmAccountNumber) {
        setFormError("Bank account inputs must match.");
        return;
      }
      if (!routingCode.trim()) {
        setFormError(
          country === "IN"
            ? "Enter the bank IFSC code."
            : "Enter the 9-digit routing number.",
        );
        return;
      }
      payload = {
        payeeType,
        beneficiaryName: beneficiaryName.trim(),
        destinationType: "BANK_ACCOUNT",
        countryCode: country,
        currencyCode: country === "IN" ? "INR" : "USD",
        accountNumber,
        confirmAccountNumber,
        routingCode: routingCode.trim().toUpperCase(),
      };
    } else if (method === "UPI") {
      if (country !== "IN" || !upiId.trim()) {
        setFormError("Enter a valid India UPI ID.");
        return;
      }
      payload = {
        payeeType,
        beneficiaryName: beneficiaryName.trim(),
        destinationType: "UPI",
        countryCode: "IN",
        currencyCode: "INR",
        upiId: upiId.trim(),
      };
    } else {
      if (country !== "US" || !paypalEmail.trim()) {
        setFormError("Enter the PayPal email address.");
        return;
      }
      payload = {
        payeeType,
        beneficiaryName: beneficiaryName.trim(),
        destinationType: "PAYPAL",
        countryCode: "US",
        currencyCode: "USD",
        paypalEmail: paypalEmail.trim(),
      };
    }
    setFormError(null);
    try {
      await onSave(payload);
      onClose();
    } catch {
      setAccountNumber("");
      setConfirmAccountNumber("");
      setRoutingCode("");
      setUpiId("");
      setPaypalEmail("");
      setFormError(
        "The destination was not saved. Re-enter the secure values and try again.",
      );
    }
  };

  return (
    <SideDrawer
      isOpen
      onClose={onClose}
      title={
        destination ? "Replace payout destination" : "Add payout destination"
      }
      subtitle="Existing secure values are never displayed. Enter every destination value again."
      width="500px"
      footer={
        <div className="creator-payout-settings__drawer-actions">
          <Button
            type="button"
            variant="ghost"
            disabled={saving}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button type="button" disabled={saving} onClick={() => void save()}>
            {saving ? "Saving…" : "Save as configured — unverified"}
          </Button>
        </div>
      }
    >
      <div className="creator-payout-settings__drawer-body">
        {formError ? (
          <div role="alert">
            <Alert tone="error" title="Review secure destination">
              {formError}
            </Alert>
          </div>
        ) : null}
        <Alert tone="warning" title="Secure re-entry required">
          Account, routing, UPI, and PayPal values are write-only. They cannot
          be recovered from Settings after saving.
        </Alert>
        <div className="creator-payout-settings__form-grid">
          <SelectField
            label="Country"
            value={country}
            disabled
            options={[
              { value: "IN", label: "India" },
              { value: "US", label: "United States" },
            ]}
            helperText="Country follows the legal profile."
          />
          <SelectField
            label="Payee type"
            value={payeeType}
            disabled
            options={[
              { value: "INDIVIDUAL", label: "Individual" },
              { value: "BUSINESS", label: "Business" },
            ]}
          />
          <SelectField
            label="Payout method"
            value={method}
            onChange={(event) =>
              setMethod(event.target.value as CreatorPayoutDestinationType)
            }
            options={availableMethods.map((value) => ({
              value,
              label: methodLabels[value],
            }))}
          />
          <TextField
            label="Beneficiary legal name"
            autoComplete="name"
            value={beneficiaryName}
            onChange={(event) => setBeneficiaryName(event.target.value)}
          />
          {method === "BANK_ACCOUNT" ? (
            <>
              <TextField
                label="Bank account number"
                type="password"
                inputMode="numeric"
                autoComplete="off"
                value={accountNumber}
                onChange={(event) => setAccountNumber(event.target.value)}
              />
              <TextField
                label="Confirm bank account number"
                type="password"
                inputMode="numeric"
                autoComplete="off"
                value={confirmAccountNumber}
                onChange={(event) =>
                  setConfirmAccountNumber(event.target.value)
                }
              />
              <TextField
                label={country === "IN" ? "IFSC code" : "Routing number"}
                inputMode={country === "US" ? "numeric" : "text"}
                autoComplete="off"
                value={routingCode}
                onChange={(event) => setRoutingCode(event.target.value)}
              />
            </>
          ) : null}
          {method === "UPI" ? (
            <TextField
              label="UPI ID"
              autoComplete="off"
              value={upiId}
              onChange={(event) => setUpiId(event.target.value)}
            />
          ) : null}
          {method === "PAYPAL" ? (
            <TextField
              label="PayPal email"
              type="email"
              autoComplete="off"
              value={paypalEmail}
              onChange={(event) => setPaypalEmail(event.target.value)}
            />
          ) : null}
        </div>
      </div>
    </SideDrawer>
  );
}
