export type BrandSettingsRole =
  | "BRAND_OWNER"
  | "FINANCE_ADMIN"
  | "CAMPAIGN_MANAGER";

export type NotificationCategory =
  | "BILLING_SUBSCRIPTION"
  | "ESCROW_PAYOUTS"
  | "CAMPAIGNS_APPLICATIONS"
  | "COLLABORATIONS"
  | "BRAND_INTELLIGENCE"
  | "TEAM_ACCOUNT_INTEGRATIONS";

export type BillingProfileState =
  | "NOT_CONFIGURED"
  | "CONFIGURED"
  | "UPDATED";

export type BillingRequiredField =
  | "legal_entity_name"
  | "legal_entity_type"
  | "billing_country_code"
  | "billing_address";

export type BrandGeneralResponse = {
  current_user_role: BrandSettingsRole;
  personal_profile: {
    first_name: string | null;
    last_name: string | null;
    email: string;
    avatar_url: string | null;
  };
  organization: {
    company_legal_name: string | null;
    corporate_address: string | null;
    country_code: string | null;
    currency_code: string | null;
    tax_id: string | null;
  };
  brand_identity: {
    display_name: string | null;
    website_url: string | null;
    logo_url: string | null;
    is_locked: boolean;
  };
  team: {
    members: Array<{
      membership_id: string;
      user_id: string;
      name: string | null;
      email: string;
      role: BrandSettingsRole;
      status: "ACTIVE";
      is_current_user: boolean;
    }>;
    pending_invitations: Array<{
      invitation_id: string;
      email: string;
      role: BrandSettingsRole;
      status: string;
      expires_at: string;
    }>;
    seat_usage: {
      active_members: number;
      pending_invitations: number;
      max_seats: number;
    };
  };
};

export type UpdateBrandGeneralPayload = {
  firstName?: string;
  lastName?: string;
  organizationLegalName?: string;
};

export type BrandBillingProfileResponse = {
  is_read_only: boolean;
  profile_state: BillingProfileState;
  is_complete_for_paid_conversion: boolean;
  missing_required_fields: BillingRequiredField[];
  billing_profile: {
    profile_id?: string;
    legal_entity_name: string;
    legal_entity_type: string;
    billing_country_code: string;
    billing_address: string;
    gstin: string | null;
    profile_state: Exclude<BillingProfileState, "NOT_CONFIGURED">;
    configured_at: string | null;
    updated_at: string;
  } | null;
};

export type UpsertBrandBillingProfilePayload = {
  legalEntityName: string;
  legalEntityType: string;
  billingCountryCode: string;
  billingAddress: string;
  gstin?: string | null;
};

export type BrandWithdrawalAccountResponse = {
  is_read_only: boolean;
  withdrawal_account: {
    account_id: string;
    beneficiary_name: string;
    bank_name: string;
    account_last_4: string | null;
    ifsc_code: string;
    is_verified: boolean;
    updated_at: string;
  } | null;
};

export type LinkBrandWithdrawalAccountPayload = {
  beneficiaryName: string;
  bankName: string;
  accountNumber: string;
  confirmAccountNumber: string;
  ifscCode: string;
};

export type BrandNotificationSettingLine = {
  category: NotificationCategory;
  label: string;
  optional_email_enabled: boolean;
};

export type BrandNotificationsResponse = {
  settings: BrandNotificationSettingLine[];
  mandatory_system_email_unaffected: boolean;
};

export type UpdateBrandNotificationsPayload = {
  settings: Array<{
    category: NotificationCategory;
    optionalEmailEnabled: boolean;
  }>;
};

export type InviteTeamMemberPayload = {
  email: string;
  role: BrandSettingsRole;
};

export type UpdateTeamRolePayload = {
  membershipId: string;
  role: BrandSettingsRole;
};

export type TeamInvitationPresentation = {
  brand_name: string;
  email: string;
  role: BrandSettingsRole;
  expires_at: string;
  requires_account_bootstrap: boolean;
};

export type TeamInvitationDispatch = {
  invitation_id: string;
  email: string;
  role: BrandSettingsRole;
  expires_at: string;
  delivery_status: "DISPATCHED";
};
