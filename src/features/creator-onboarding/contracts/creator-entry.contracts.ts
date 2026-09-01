import type { AuthSession } from "../../../shared/auth/auth-session";

export type CreatorEntryNextAction =
  | "SIGN_IN"
  | "VERIFY_EMAIL"
  | "RESOLVE_ACCOUNT_CONTEXT"
  | "RECOVER_CREATOR_CONTEXT"
  | "CONNECT_INSTAGRAM"
  | "RECONNECT_INSTAGRAM"
  | "REVALIDATE_INSTAGRAM"
  | "CREATOR_WORKSPACE_ENTRY"
  | "RETURN_TO_ORIGINATING_CAMPAIGN";

export type CreatorEntryState = {
  accountContext:
    | "CREATOR_READY"
    | "ACCOUNT_CONTEXT_CONFLICT"
    | "CONTEXT_RECOVERY_REQUIRED";
  onboardingStatus: "COMPLETE" | "INCOMPLETE";
  canEnterCreatorPlatform: boolean;
  nextAction: CreatorEntryNextAction;
  instagram: {
    identityConnection: "NOT_CONNECTED" | "DISCONNECTED" | "CONNECTED";
    basicAuthorization: "UNKNOWN" | "AVAILABLE" | "UNAVAILABLE";
    insightsCapability: "UNKNOWN" | "AVAILABLE" | "UNAVAILABLE";
    authorizationHealth: string;
  };
};

export type RegistrationAccepted = {
  accepted: true;
  message: string;
  nextAction: "VERIFY_EMAIL";
};

export type RegistrationOtpRequested = { accepted: true; message: string };
export type CreatorRegistrationSession = AuthSession;
export type InstagramAuthorization = { authorizationUrl: string };
export type InstagramCompletion = { connected: true; state: CreatorEntryState };
export type InstagramRevalidation = {
  revalidated: boolean;
  state: CreatorEntryState;
};

export type CampaignContinuationIssued = {
  intent: "CAMPAIGN_APPLY";
  expiresAt: string;
  continuationPresent: true;
};

export type CampaignContinuationPresence = { present: boolean };

export type CampaignContinuationResolution =
  | {
      status: "PENDING_CREATOR_ENTRY";
      intent: "CAMPAIGN_APPLY";
      nextAction: CreatorEntryNextAction;
    }
  | {
      status: "READY_TO_RETURN";
      intent: "CAMPAIGN_APPLY";
      nextAction: "RETURN_TO_ORIGINATING_CAMPAIGN";
      campaign: { campaignId: string };
    };

export type InstagramCallbackBody = {
  state: string;
  code?: string;
  error?: string;
  errorDescription?: string;
};
