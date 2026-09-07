import type { CreatorWorkspaceActorRole } from "../../../shared/creator/creator-workspace-actor.contract";

export type CreatorPayeeType = "INDIVIDUAL" | "BUSINESS";
export type CreatorPayoutDestinationType = "BANK_ACCOUNT" | "UPI" | "PAYPAL";
export type CreatorPayoutDestinationState =
  | "CONFIGURED_UNVERIFIED"
  | "NEEDS_ATTENTION"
  | "DISABLED";

export type CreatorPayoutDestination = {
  destination_id: string;
  payee_type: CreatorPayeeType;
  beneficiary_name: string;
  destination_type: CreatorPayoutDestinationType;
  country_code: "IN" | "US";
  currency_code: "INR" | "USD";
  masked_display: string;
  is_primary: boolean;
  state: CreatorPayoutDestinationState;
  reason_code: string | null;
  version: number;
  encryption_key_version: number;
  disabled_at: string | null;
  updated_at: string;
};

export type CreatorLegalProfile = {
  legal_profile_id: string;
  payee_type: CreatorPayeeType;
  legal_name: string;
  country_code: "IN" | "US";
  address_line1: string;
  address_line2: string | null;
  city: string;
  state_region: string | null;
  postal_code: string;
  version: number;
  updated_at: string;
};

export type CreatorPayoutSettingsResponse = {
  actor_role: CreatorWorkspaceActorRole;
  can_manage: boolean;
  supported_rails: ReadonlyArray<{
    country_code: "IN" | "US";
    currency_code: "INR" | "USD";
    destination_type: CreatorPayoutDestinationType;
  }>;
  destination: CreatorPayoutDestination | null;
  legal_profile: CreatorLegalProfile | null;
  verification: {
    authority: "DEFERRED_TO_MVP_V2";
    provider_status: null;
  };
};

type CommonDestinationWrite = {
  payeeType: CreatorPayeeType;
  beneficiaryName: string;
  countryCode: "IN" | "US";
};

export type CreatorPayoutDestinationWrite =
  | (CommonDestinationWrite & {
      destinationType: "BANK_ACCOUNT";
      currencyCode: "INR" | "USD";
      accountNumber: string;
      confirmAccountNumber: string;
      routingCode: string;
    })
  | (CommonDestinationWrite & {
      destinationType: "UPI";
      countryCode: "IN";
      currencyCode: "INR";
      upiId: string;
    })
  | (CommonDestinationWrite & {
      destinationType: "PAYPAL";
      countryCode: "US";
      currencyCode: "USD";
      paypalEmail: string;
    });

export type CreatorLegalProfileWrite = {
  payeeType: CreatorPayeeType;
  legalName: string;
  countryCode: "IN" | "US";
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  stateRegion: string;
  postalCode: string;
};
