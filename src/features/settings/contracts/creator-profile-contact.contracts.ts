import type {
  CreatorWorkspaceAction,
  CreatorWorkspaceActorRole,
} from "../../../shared/creator/creator-workspace-actor.contract";

export type CreatorCanonicalProfileResponse = {
  actor_role: CreatorWorkspaceActorRole;
  allowed_actions: readonly CreatorWorkspaceAction[];
  can_manage_personal_name: boolean;
  profile: {
    user_name: string | null;
    display_name: string | null;
    email: string;
    avatar_url: string | null;
    primary_region: string;
  };
  organization: {
    organization_id: string;
    name: string;
  };
};

export type CreatorDefaultContact = {
  contact_id: string;
  recipient_name: string;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  state_region: string | null;
  postal_code: string;
  country_code: string;
  phone: {
    country_calling_code: string;
    national_number: string;
    e164: string;
  } | null;
  has_legacy_unstructured_phone: boolean;
  delivery_instructions: string | null;
  updated_at: string;
};

export type CreatorDefaultContactResponse = {
  actor_role: CreatorWorkspaceActorRole;
  allowed_actions: readonly CreatorWorkspaceAction[];
  default_contact: CreatorDefaultContact | null;
};

export type UpdateCreatorCanonicalProfilePayload = {
  userName?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  primaryRegion?: string;
  organizationName?: string;
};

export type UpsertCreatorDefaultContactPayload = {
  recipientName: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  stateRegion?: string | null;
  postalCode: string;
  countryCode: string;
  phoneCountryCallingCode?: string | null;
  phoneNationalNumber?: string | null;
  deliveryInstructions?: string | null;
};
