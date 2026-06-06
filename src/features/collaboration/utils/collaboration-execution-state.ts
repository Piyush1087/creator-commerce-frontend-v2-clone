import type {
  CollaborationDetailResponse,
  CollaborationStage,
} from "../contracts/collaboration.contracts";
import type { UserRole } from "../../../shared/auth/user-role";

export function pendingMedia(detail: CollaborationDetailResponse) {
  return (
    detail.media.find((m) => m.status === "PENDING") ??
    detail.media[0] ??
    null
  );
}

export function creatorHasSubmittedQuote(detail: CollaborationDetailResponse) {
  return detail.thread.negotiationRound > 0;
}

export function hasBrandCounterOffer(detail: CollaborationDetailResponse) {
  const offer = detail.commercials?.brand_counter_offer;
  return offer != null && offer > 0;
}

export function escrowAwaitingFund(detail: CollaborationDetailResponse) {
  const status = detail.commercials?.escrow_status;
  return !status || status === "AWAITING_FUNDS";
}

export function getWaitingMessage(
  role: UserRole,
  stage: CollaborationStage,
  detail: CollaborationDetailResponse,
): string | null {
  if (detail.thread.isTerminated) {
    return null;
  }

  switch (stage) {
    case "STAGE_1_NEGOTIATION":
      if (role === "BRAND" && !creatorHasSubmittedQuote(detail)) {
        return "Waiting for the creator to submit their quote.";
      }
      if (role === "CREATOR" && creatorHasSubmittedQuote(detail) && !hasBrandCounterOffer(detail)) {
        return "Your quote was sent. Waiting for the brand to accept or counter.";
      }
      return null;
    case "STAGE_2_SECUREMENT":
      if (detail.thread.payoutMode === "BARTER") {
        return "Barter deal — payment step skipped.";
      }
      if (detail.thread.payoutMode === "ESCROW" && role === "CREATOR") {
        return escrowAwaitingFund(detail)
          ? "Waiting for the brand to fund escrow."
          : "Escrow funded. Logistics unlocks next.";
      }
      if (detail.thread.payoutMode === "MANUAL" && role === "BRAND") {
        return detail.commercials?.advance_receipt_url
          ? "Receipt uploaded. Waiting for creator confirmation."
          : "Upload the advance payment receipt for the creator.";
      }
      if (detail.thread.payoutMode === "MANUAL" && role === "CREATOR") {
        return detail.commercials?.advance_receipt_url
          ? "Confirm when you have received the advance payment."
          : "Waiting for the brand to upload the advance receipt.";
      }
      return null;
    case "STAGE_3_LOGISTICS":
      if (role === "CREATOR") {
        return detail.logistics?.trackingId ||
          detail.logistics?.digitalAccessCredentials ||
          detail.logistics?.redemptionCode
          ? "Confirm when you have received access or product."
          : "Waiting for the brand to dispatch logistics or access.";
      }
      if (role === "BRAND") {
        if (detail.logistics?.isReceivedConfirmed) {
          return "Creator confirmed receipt. Production stage is next.";
        }
        if (logisticsIsDispatched(detail)) {
          return "Dispatched. Waiting for the creator to confirm receipt.";
        }
      }
      return null;
    case "STAGE_4_CONTENT_REVIEW": {
      const pending = pendingMedia(detail);
      if (role === "BRAND") {
        return pending
          ? null
          : "Waiting for the creator to submit content for review.";
      }
      if (!detail.logistics?.isReceivedConfirmed) {
        return "Confirm logistics receipt before uploading content.";
      }
      return pending?.status === "PENDING"
        ? "Draft submitted. Waiting for brand review."
        : null;
    }
    case "STAGE_5_PUBLISHING":
      if (role === "BRAND") {
        return detail.finalization?.livePostUrl
          ? "Review the live post URL and verify compliance."
          : "Waiting for the creator to submit the live post link.";
      }
      return detail.finalization?.isComplianceVerified
        ? "Compliance verified. Ratings unlock in the next step."
        : "Submit your live Instagram, TikTok, or YouTube post URL.";
    case "STAGE_6_FEEDBACK_SYNC":
      if (role === "BRAND" && detail.finalization?.brandRating != null) {
        return "Thanks — waiting for the creator rating.";
      }
      if (role === "CREATOR" && detail.finalization?.creatorRating != null) {
        return "Thanks — waiting for the brand rating.";
      }
      return null;
    default:
      return null;
  }
}

export function isD2cIndustry(industry: string) {
  return industry === "D2C_ECOMMERCE";
}

export function logisticsIsDispatched(detail: CollaborationDetailResponse) {
  const l = detail.logistics;
  if (!l) {
    return false;
  }
  return Boolean(
    l.trackingId?.trim() ||
      l.digitalAccessCredentials?.trim() ||
      l.redemptionCode?.trim(),
  );
}

export function canBrandDispatchLogistics(detail: CollaborationDetailResponse) {
  return (
    detail.thread.currentStage === "STAGE_3_LOGISTICS" &&
    !detail.thread.isTerminated &&
    !logisticsIsDispatched(detail)
  );
}

export function canCreatorConfirmReceipt(detail: CollaborationDetailResponse) {
  return (
    detail.thread.currentStage === "STAGE_3_LOGISTICS" &&
    !detail.thread.isTerminated &&
    logisticsIsDispatched(detail) &&
    !detail.logistics?.isReceivedConfirmed
  );
}

export function canCreatorSubmitMedia(detail: CollaborationDetailResponse) {
  return (
    detail.thread.currentStage === "STAGE_4_CONTENT_REVIEW" &&
    !detail.thread.isTerminated &&
    detail.logistics?.isReceivedConfirmed &&
    !pendingMedia(detail)
  );
}

export function canBrandFundEscrow(detail: CollaborationDetailResponse) {
  const status = detail.commercials?.escrow_status;
  return (
    detail.thread.currentStage === "STAGE_2_SECUREMENT" &&
    detail.thread.payoutMode === "ESCROW" &&
    (!status || status === "AWAITING_FUNDS")
  );
}

export function canCreatorSubmitQuote(detail: CollaborationDetailResponse) {
  if (detail.thread.isTerminated || detail.thread.currentStage !== "STAGE_1_NEGOTIATION") {
    return false;
  }
  if (detail.commercials?.is_final_offer) {
    return false;
  }
  if (detail.thread.negotiationRound >= 2) {
    return false;
  }
  if (detail.thread.negotiationRound >= 1 && !hasBrandCounterOffer(detail)) {
    return false;
  }
  return true;
}

export function canBrandSendCounter(detail: CollaborationDetailResponse) {
  return (
    detail.thread.currentStage === "STAGE_1_NEGOTIATION" &&
    !detail.thread.isTerminated &&
    creatorHasSubmittedQuote(detail) &&
    !detail.commercials?.is_final_offer &&
    !hasBrandCounterOffer(detail) &&
    detail.thread.negotiationRound < 2
  );
}
