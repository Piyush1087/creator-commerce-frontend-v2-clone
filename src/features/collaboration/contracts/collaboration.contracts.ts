export type CollaborationStage =

  | "STAGE_1_NEGOTIATION"

  | "STAGE_2_SECUREMENT"

  | "STAGE_3_LOGISTICS"

  | "STAGE_4_CONTENT_REVIEW"

  | "STAGE_5_PUBLISHING"

  | "STAGE_6_FEEDBACK_SYNC";



export type CollaborationPayoutMode = "ESCROW" | "MANUAL" | "BARTER";



export type CollaborationThreadRow = {

  collaboration_id: string;

  brand_profile_id: string;

  creator_user_id: string;

  campaign_id: string;

  campaign_name: string;

  brief_id: string;

  brief_title: string;

  creator_display_name: string | null;

  creator_handle: string | null;

  brand_name: string;

  current_stage: CollaborationStage;

  payout_mode: CollaborationPayoutMode;

  industry: string;

  negotiation_round: number;

  fulfillment_issue_count: number;

  revision_count: number;

  unread_count: number;

  last_message_snippet: string | null;

  last_message_at: string | null;

  is_paused: boolean;

  is_terminated: boolean;

};



export type CollaborationCommercials = {

  initial_quote: number;

  brand_counter_offer: number | null;

  final_quote: number;

  product_retail_value: number;

  is_final_offer: boolean;

  advance_30_amount: number;

  balance_70_amount: number;

  total_quote: number;

  escrow_status: string | null;

  advance_receipt_url: string | null;

  creator_bank_details_id: string | null;

};



export type CollaborationDetailResponse = {

  thread: {

    id: string;

    currentStage: CollaborationStage;

    payoutMode: CollaborationPayoutMode;

    industry: string;

    negotiationRound: number;

    fulfillmentIssueCount: number;

    revisionCount: number;

    isTerminated: boolean;

    isPaused: boolean;

    creatorHandle: string;

    campaign: { name: string };

    brief: { internalTitle: string; creativeGuidelines: string };

    brandProfile: { name: string };

    creatorUser: {

      name: string | null;

      email: string;

      creatorProfile: {

        displayName: string | null;

        instagramHandle: string | null;

      } | null;

    };

  };

  commercials: CollaborationCommercials | null;

  logistics: {

    trackingId: string | null;

    courierName: string | null;

    digitalAccessCredentials: string | null;

    redemptionCode: string | null;

    isReceivedConfirmed: boolean;

    lastReportedIssue: string | null;

    issueDescription: string | null;

  } | null;

  finalization: {

    livePostUrl: string | null;

    isComplianceVerified: boolean;

    brandRating: number | null;

    creatorRating: number | null;

    brandReviewText: string | null;

    creatorReviewText: string | null;

    reviewsVisible: boolean;

  } | null;

  media: Array<{

    id: string;

    phase: string;

    status: string;

    mediaUrl: string;

    versionNumber: number;

    brandFeedback: string | null;

  }>;

};



export type CollaborationMessageRow = {

  message_id: string;

  kind: "USER" | "SYSTEM";

  body: string;

  sender_user_id: string | null;

  system_event_tag: string | null;

  created_at: string;

};



export type ListThreadsResponse = {

  rows: CollaborationThreadRow[];

};



export type ListMessagesResponse = {

  messages: CollaborationMessageRow[];

};


