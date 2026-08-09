export type CreatorTeamRole = "OWNER" | "MANAGER" | "ASSISTANT";

export type SocialPlatform = "INSTAGRAM" | "TIKTOK" | "YOUTUBE";

export type CreatorProfileResponse = {
  current_user_role: CreatorTeamRole;
  is_read_only: boolean;
  profile: {
    display_name: string | null;
    first_name: string | null;
    last_name: string | null;
    email: string;
    avatar_url: string | null;
    primary_region: string | null;
  };
  workspace: {
    workspace_id: string;
    organization_display_name: string | null;
  };
};

export type UpdateCreatorProfilePayload = {
  displayName?: string;
  firstName?: string;
  lastName?: string;
};

export type CreatorShippingAddress = {
  address_id: string;
  recipient_legal_name: string;
  street_address_line1: string;
  street_address_line2: string | null;
  city: string;
  state_province: string | null;
  postal_code_zip: string;
  country_iso_code: string;
  delivery_instructions_narrative: string | null;
  is_primary_destination: boolean;
  updated_at: string;
};

export type CreatorShippingResponse = {
  shipping_address: CreatorShippingAddress | null;
};

export type UpsertCreatorShippingPayload = {
  recipientLegalName: string;
  streetAddressLine1: string;
  streetAddressLine2?: string | null;
  city: string;
  stateProvince: string;
  postalCodeZip: string;
  countryIsoCode: string;
  deliveryInstructionsNarrative?: string | null;
  isPrimaryDestination?: boolean;
};

export type CreatorWorkspaceResponse = {
  current_user_role: CreatorTeamRole;
  workspace: {
    workspace_id: string;
    organization_display_name: string | null;
  };
  team: {
    members: Array<{
      member_id: string;
      email: string;
      name: string | null;
      role: CreatorTeamRole;
      status: "ACTIVE";
      is_current_user: boolean;
    }>;
    pending_invitations: Array<{
      invitation_id: string;
      email: string;
      role: CreatorTeamRole;
      expires_at: string;
    }>;
    seat_usage: {
      active_members: number;
      pending_invitations: number;
      max_seats: number;
      is_at_capacity: boolean;
    };
  };
};

export type UpdateWorkspacePayload = {
  organizationDisplayName: string;
};

export type InviteWorkspaceMemberPayload = {
  recipientEmail: string;
  allocatedRole: CreatorTeamRole;
};

export type CreatorSocialChannel = {
  integration_id: string;
  platform: SocialPlatform;
  handle: string | null;
  display_title: string | null;
  avatar_url: string | null;
  token_state: string;
  token_expires_at: string | null;
  last_metadata_sync_at: string | null;
  is_token_valid: boolean;
};

export type CreatorSocialListResponse = {
  is_read_only: boolean;
  channels: CreatorSocialChannel[];
};

export type CreatorPayoutSettingsResponse = {
  is_read_only: boolean;
  bank_node: {
    bank_name: string;
    beneficiary_name: string;
    account_last_4: string | null;
    ifsc_code: string | null;
    verification_status: string;
  } | null;
  settlement_profile: {
    account_holder_name: string;
    is_pan_verified: boolean;
    pan_masked: string | null;
    is_settlement_route_active: boolean;
  } | null;
};

export type UpsertCreatorPayoutBankPayload = {
  beneficiaryLegalName: string;
  accountNumber: string;
  confirmAccountNumber: string;
  routingIfscSwift: string;
  payoutCurrencyToken?: string;
};
