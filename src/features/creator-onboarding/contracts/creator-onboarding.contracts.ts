export type ActivatedModule =
  | "MESSY_DMS_TO_DEALS"
  | "BUILDING_UPDATING_MEDIA_KIT"
  | "POST_PERFORMANCE_PRICING"
  | "CONTRACT_ESCROW_SECURITY";

export type HandleCheckApproved = {
  outcome: "approved";
  onboardingTrackId: string;
  eligibility: {
    score: number;
    percentileRank: number;
    vertical: string;
  };
  isExistingUserRoute: boolean;
};

export type HandleCheckWaitlisted = {
  outcome: "waitlisted";
  onboardingTrackId: string;
  message: string;
};

export type HandleCheckResponse = HandleCheckApproved | HandleCheckWaitlisted;

export type StageFeaturesResponse = {
  onboardingTrackId: string;
  stagedModules: ActivatedModule[];
};

export type SignupResponse = {
  userId: string;
  email: string;
  onboardingTrackId: string;
  otp: { sent: true; expiresAt: string };
  message: string;
};

export type MetaConnectResponse = {
  onboardingTrackId: string;
  instagram: {
    username: string;
    accountType: string;
    followersCount: number;
  };
  isExistingUserRoute: boolean;
};

export type ActivateSyncResponse = {
  onboardingTrackId: string;
  status: string;
  message: string;
};

export type OnboardingTrackResponse = {
  id: string;
  instagramHandle: string;
  status: string;
  isApproved: boolean;
  eligibilityScore: number | null;
  percentileRank: number | null;
  detectedVertical: string | null;
  stagedModules: ActivatedModule[];
  isExistingUserRoute: boolean;
  userId: string | null;
};
