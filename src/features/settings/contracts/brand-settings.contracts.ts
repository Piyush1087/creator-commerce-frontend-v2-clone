export type BrandSettingsRole =
  | "BRAND_OWNER"
  | "FINANCE_ADMIN"
  | "CAMPAIGN_MANAGER";

export type NotificationCategory =
  | "ESCROW_LOW_BALANCE"
  | "MILESTONE_RELEASE_REQUEST"
  | "TAX_COMPLIANCE_ALERT"
  | "CAMPAIGN_BUDGET_OVERRUN";

export type NotificationChannel = "EMAIL" | "IN_APP" | "SLACK_WEBHOOK";

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
  billing_profile: {
    registered_company_name: string;
    corporate_billing_address: string;
    gstin: string | null;
    pan: string | null;
    default_tds_percentage: number;
    currency_preference: string;
    updated_at: string;
  } | null;
};

export type UpsertBrandBillingProfilePayload = {
  registeredCompanyName: string;
  corporateBillingAddress: string;
  gstin?: string | null;
  pan?: string | null;
  defaultTdsPercentage?: number;
  currencyPreference?: string;
};

export type BrandWithdrawalAccountResponse = {
  is_read_only: boolean;
  withdrawal_account: {
    account_id: string;
    beneficiary_name: string;
    bank_name: string;
    account_last_4: string | null;
    ifsc_code: string | null;
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
  setting_id?: string;
  category: NotificationCategory;
  channel: NotificationChannel;
  is_enabled: boolean;
  slack_webhook_url: string | null;
};

export type BrandNotificationsResponse = {
  settings: BrandNotificationSettingLine[];
};

export type UpdateBrandNotificationsPayload = {
  settings: Array<{
    category: NotificationCategory;
    channel: NotificationChannel;
    isEnabled: boolean;
    slackWebhookUrl?: string | null;
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
