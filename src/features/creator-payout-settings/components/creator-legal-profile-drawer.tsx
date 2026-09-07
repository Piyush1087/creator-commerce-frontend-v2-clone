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
  CreatorLegalProfileWrite,
  CreatorPayeeType,
} from "../contracts/creator-payout-settings.contract";

type CountryCode = "IN" | "US";

type Props = {
  legalProfile: CreatorLegalProfile | null;
  locksIdentityScope: boolean;
  saving: boolean;
  onClose: () => void;
  onSave: (input: CreatorLegalProfileWrite) => Promise<void>;
};

export function CreatorLegalProfileDrawer({
  legalProfile,
  locksIdentityScope,
  saving,
  onClose,
  onSave,
}: Props) {
  const [country, setCountry] = useState<CountryCode>(
    legalProfile?.country_code ?? "IN",
  );
  const [payeeType, setPayeeType] = useState<CreatorPayeeType>(
    legalProfile?.payee_type ?? "INDIVIDUAL",
  );
  const [legalName, setLegalName] = useState(legalProfile?.legal_name ?? "");
  const [addressLine1, setAddressLine1] = useState(
    legalProfile?.address_line1 ?? "",
  );
  const [addressLine2, setAddressLine2] = useState(
    legalProfile?.address_line2 ?? "",
  );
  const [city, setCity] = useState(legalProfile?.city ?? "");
  const [stateRegion, setStateRegion] = useState(
    legalProfile?.state_region ?? "",
  );
  const [postalCode, setPostalCode] = useState(legalProfile?.postal_code ?? "");
  const [formError, setFormError] = useState<string | null>(null);

  const save = async () => {
    if (
      !legalName.trim() ||
      !addressLine1.trim() ||
      !city.trim() ||
      !stateRegion.trim() ||
      !postalCode.trim()
    ) {
      setFormError("Complete every required legal identity field.");
      return;
    }
    setFormError(null);
    try {
      await onSave({
        payeeType,
        legalName: legalName.trim(),
        countryCode: country,
        addressLine1: addressLine1.trim(),
        addressLine2: addressLine2.trim() || null,
        city: city.trim(),
        stateRegion: stateRegion.trim(),
        postalCode: postalCode.trim(),
      });
      onClose();
    } catch {
      setFormError(
        "The legal profile was not saved. Review the fields and try again.",
      );
    }
  };

  return (
    <SideDrawer
      isOpen
      onClose={onClose}
      title={legalProfile ? "Edit legal profile" : "Add legal profile"}
      subtitle="Minimum legal identity only. Tax IDs, PAN, KYC, and provider verification are outside this MVP."
      width="540px"
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
            {saving ? "Saving…" : "Save legal profile"}
          </Button>
        </div>
      }
    >
      <div className="creator-payout-settings__drawer-body">
        {formError ? (
          <div role="alert">
            <Alert tone="error" title="Review legal profile">
              {formError}
            </Alert>
          </div>
        ) : null}
        {locksIdentityScope ? (
          <p className="creator-payout-settings__notice">
            Disable the active destination before changing country or payee
            type.
          </p>
        ) : null}
        <div className="creator-payout-settings__form-grid">
          <SelectField
            label="Payee type"
            value={payeeType}
            disabled={locksIdentityScope}
            onChange={(event) =>
              setPayeeType(event.target.value as CreatorPayeeType)
            }
            options={[
              { value: "INDIVIDUAL", label: "Individual" },
              { value: "BUSINESS", label: "Business" },
            ]}
          />
          <SelectField
            label="Country"
            value={country}
            disabled={locksIdentityScope}
            onChange={(event) => setCountry(event.target.value as CountryCode)}
            options={[
              { value: "IN", label: "India" },
              { value: "US", label: "United States" },
            ]}
          />
          <TextField
            label="Legal name"
            value={legalName}
            onChange={(event) => setLegalName(event.target.value)}
          />
          <TextField
            label="Address line 1"
            autoComplete="address-line1"
            value={addressLine1}
            onChange={(event) => setAddressLine1(event.target.value)}
          />
          <TextField
            label="Address line 2 (optional)"
            autoComplete="address-line2"
            value={addressLine2}
            onChange={(event) => setAddressLine2(event.target.value)}
          />
          <TextField
            label="City"
            autoComplete="address-level2"
            value={city}
            onChange={(event) => setCity(event.target.value)}
          />
          <TextField
            label="State / region"
            autoComplete="address-level1"
            value={stateRegion}
            onChange={(event) => setStateRegion(event.target.value)}
          />
          <TextField
            label={country === "IN" ? "Postal code" : "ZIP code"}
            autoComplete="postal-code"
            value={postalCode}
            onChange={(event) => setPostalCode(event.target.value)}
          />
        </div>
      </div>
    </SideDrawer>
  );
}
