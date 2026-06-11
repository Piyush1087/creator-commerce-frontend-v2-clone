import { useEffect, useState } from "react";

import { Alert, Button, TextField } from "../../../design-system/aurora";
import type { UserRole } from "../../../shared/auth/user-role";
import {
  acceptCollaborationCommercials,
  confirmCollaborationReceipt,
  confirmManualAdvance,
  dispatchCollaborationLogistics,
  fundCollaborationEscrow,
  reportFulfillmentIssue,
  reviewCollaborationMedia,
  submitBrandCounterOffer,
  submitCollaborationLivePost,
  submitCollaborationMedia,
  submitCollaborationReview,
  submitCreatorQuote,
  uploadAdvanceReceipt,
  upsertCreatorBankDetails,
  verifyCollaborationCompliance,
} from "../api/collaboration-client";
import type { CollaborationDetailResponse } from "../contracts/collaboration.contracts";
import { collaborationStageChip } from "../utils/stage-labels";
import {
  canBrandDispatchLogistics,
  canBrandFundEscrow,
  canBrandSendCounter,
  canCreatorConfirmReceipt,
  canCreatorSubmitMedia,
  canCreatorSubmitQuote,
  creatorHasSubmittedQuote,
  getWaitingMessage,
  hasBrandCounterOffer,
  isD2cIndustry,
  logisticsIsDispatched,
  pendingMedia,
} from "../utils/collaboration-execution-state";
import {
  validateLivePostUrl,
  validateMediaUrl,
  validateQuoteAmount,
  validateReceiptUrl,
} from "../utils/collaboration-validation";

type Props = {
  role: UserRole;
  detail: CollaborationDetailResponse | null;
  collaborationId: string | null;
  onRefresh: () => void;
  onDetailUpdated: (detail: CollaborationDetailResponse) => void;
  onError: (message: string) => void;
};

export function CollaborationExecutionHub({
  role,
  detail,
  collaborationId,
  onRefresh,
  onDetailUpdated,
  onError,
}: Props) {
  const [counterOffer, setCounterOffer] = useState("");
  const [quote, setQuote] = useState("");
  const [trackingId, setTrackingId] = useState("");
  const [courierName, setCourierName] = useState("BlueDart");
  const [digitalAccess, setDigitalAccess] = useState("");
  const [redemptionCode, setRedemptionCode] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [liveUrl, setLiveUrl] = useState("https://www.instagram.com/");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [rating, setRating] = useState("5");
  const [reviewText, setReviewText] = useState("");
  const [busy, setBusy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!detail?.commercials) {
      return;
    }
    if (!quote && detail.commercials.initial_quote > 0) {
      setQuote(String(detail.commercials.initial_quote));
    }
  }, [detail, quote]);

  if (!collaborationId || !detail) {
    return (
      <div className="collab-empty">
        Select a thread to view execution actions.
      </div>
    );
  }

  const stage = detail.thread.currentStage;
  const commercials = detail.commercials;
  const waiting = getWaitingMessage(role, stage, detail);

  const run = async (fn: () => Promise<CollaborationDetailResponse>) => {
    setBusy(true);
    onError("");
    setFieldErrors({});
    try {
      const updated = await fn();
      onDetailUpdated(updated);
      onRefresh();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="collab-pane__scroll collab-pane__scroll--execution">
      <div className="collab-exec-card collab-exec-card--summary">
        <p className="collab-exec-card__kicker">
          {collaborationStageChip(stage)} · {detail.thread.payoutMode}
        </p>
        <p className="collab-exec-card__summary">
          ₹{commercials?.total_quote ?? 0} total
          {commercials
            ? ` · 30% ₹${commercials.advance_30_amount} · 70% ₹${commercials.balance_70_amount}`
            : ""}
        </p>
        {detail.thread.negotiationRound > 0 ? (
          <p className="collab-exec-card__summary">
            Negotiation round {detail.thread.negotiationRound}/2
          </p>
        ) : null}
      </div>

      <div className="collab-exec-card collab-exec-card--brief">
        <h4 className="collab-exec-card__title">Brief</h4>
        <p className="collab-exec-card__body">{detail.thread.brief.internalTitle}</p>
        <p className="collab-exec-card__muted">
          {detail.thread.brief.creativeGuidelines.slice(0, 280)}
          {detail.thread.brief.creativeGuidelines.length > 280 ? "…" : ""}
        </p>
      </div>

      {waiting ? (
        <Alert tone="warning" title="Status">
          {waiting}
        </Alert>
      ) : null}

      {detail.thread.isTerminated ? (
        <Alert tone="error" title="Collaboration ended">
          This collaboration is terminated or paused. Chat history remains available.
        </Alert>
      ) : null}

      {stage === "STAGE_1_NEGOTIATION" && role === "CREATOR" && !detail.thread.isTerminated ? (
        <>
          {hasBrandCounterOffer(detail) ? (
            <div className="collab-exec-card">
              <h4 className="collab-exec-card__title">Brand counter-offer</h4>
              <p className="collab-exec-card__body">
                ₹{detail.commercials?.brand_counter_offer} (30/70 split recalculated)
              </p>
              <div className="collab-exec-actions">
                <Button
                  disabled={busy}
                  onClick={() =>
                    void run(() => acceptCollaborationCommercials(collaborationId))
                  }
                >
                  Accept brand offer
                </Button>
              </div>
            </div>
          ) : null}

          {canCreatorSubmitQuote(detail) ? (
            <div className="collab-exec-card">
              <h4 className="collab-exec-card__title">Propose your quote</h4>
              <p className="collab-exec-card__muted">
                Submit your all-in rate for this brief. You have up to two negotiation rounds.
              </p>
              <TextField
                label="Your quote (₹)"
                value={quote}
                error={fieldErrors.quote}
                onChange={(e) => setQuote(e.target.value)}
              />
              <div className="collab-exec-actions">
                <Button
                  disabled={busy}
                  onClick={() => {
                    const err = validateQuoteAmount(quote);
                    if (err) {
                      setFieldErrors({ quote: err });
                      return;
                    }
                    void run(() =>
                      submitCreatorQuote(collaborationId, Number(quote) || 0),
                    );
                  }}
                >
                  Send quote to brand
                </Button>
              </div>
            </div>
          ) : null}

          {detail.commercials?.is_final_offer && creatorHasSubmittedQuote(detail) ? (
            <Alert tone="warning" title="Final offer sent">
              You submitted your final rate. The brand can accept or decline — no further
              counters from you.
            </Alert>
          ) : null}
        </>
      ) : null}

      {stage === "STAGE_1_NEGOTIATION" && role === "BRAND" && !detail.thread.isTerminated ? (
        <>
          {creatorHasSubmittedQuote(detail) ? (
            <div className="collab-exec-card">
              <h4 className="collab-exec-card__title">Review creator quote</h4>
              <p className="collab-exec-card__body">
                @{detail.thread.creatorHandle} · ₹{commercials?.total_quote ?? 0}
              </p>
              {commercials?.is_final_offer ? (
                <Alert tone="warning" title="Final offer">
                  Creator sent a final offer. Counter-offer is disabled.
                </Alert>
              ) : null}
              <div className="collab-exec-actions">
                <Button
                  disabled={busy}
                  onClick={() =>
                    void run(() => acceptCollaborationCommercials(collaborationId))
                  }
                >
                  Accept quote
                </Button>
                {canBrandSendCounter(detail) ? (
                  <>
                    <TextField
                      label="Counter offer (₹)"
                      value={counterOffer}
                      error={fieldErrors.counterOffer}
                      onChange={(e) => setCounterOffer(e.target.value)}
                    />
                    <Button
                      variant="secondary"
                      disabled={busy}
                      onClick={() => {
                        const err = validateQuoteAmount(counterOffer);
                        if (err) {
                          setFieldErrors({ counterOffer: err });
                          return;
                        }
                        void run(() =>
                          submitBrandCounterOffer(
                            collaborationId,
                            Number(counterOffer) || 0,
                          ),
                        );
                      }}
                    >
                      Send counter-offer
                    </Button>
                  </>
                ) : null}
              </div>
            </div>
          ) : commercials && commercials.initial_quote > 0 ? (
            <div className="collab-exec-card">
              <h4 className="collab-exec-card__title">Campaign offer on file</h4>
              <p className="collab-exec-card__muted">
                UCE seeded ₹{commercials.initial_quote} from approval. You can accept now or wait
                for the creator to confirm their rate.
              </p>
              <Button
                disabled={busy}
                onClick={() =>
                  void run(() => acceptCollaborationCommercials(collaborationId))
                }
              >
                Accept seeded quote
              </Button>
            </div>
          ) : null}
        </>
      ) : null}

      {stage === "STAGE_2_SECUREMENT" && !detail.thread.isTerminated ? (
        <>
          {detail.thread.payoutMode === "BARTER" ? (
            <Alert tone="warning" title="Barter">
              No cash securement — proceed via logistics when the brand dispatches access or product.
            </Alert>
          ) : null}

          {detail.thread.payoutMode === "ESCROW" && role === "BRAND" ? (
            <div className="collab-exec-card">
              <h4 className="collab-exec-card__title">Fund escrow</h4>
              <p className="collab-exec-card__muted">
                Lock ₹{commercials?.advance_30_amount ?? 0} advance into escrow (stub vault).
              </p>
              <Button
                disabled={busy || !canBrandFundEscrow(detail)}
                onClick={() => void run(() => fundCollaborationEscrow(collaborationId))}
              >
                {canBrandFundEscrow(detail) ? "Fund escrow" : "Escrow funded"}
              </Button>
            </div>
          ) : null}

          {detail.thread.payoutMode === "MANUAL" && role === "BRAND" ? (
            <div className="collab-exec-card">
              <h4 className="collab-exec-card__title">Upload advance receipt</h4>
              <TextField
                label="Receipt URL"
                value={receiptUrl}
                error={fieldErrors.receiptUrl}
                onChange={(e) => setReceiptUrl(e.target.value)}
              />
              <Button
                disabled={busy || Boolean(commercials?.advance_receipt_url)}
                onClick={() => {
                  const err = validateReceiptUrl(receiptUrl);
                  if (err) {
                    setFieldErrors({ receiptUrl: err });
                    return;
                  }
                  void run(() =>
                    uploadAdvanceReceipt(collaborationId, receiptUrl.trim()),
                  );
                }}
              >
                {commercials?.advance_receipt_url ? "Receipt uploaded" : "Upload receipt"}
              </Button>
            </div>
          ) : null}

          {detail.thread.payoutMode === "MANUAL" && role === "CREATOR" ? (
            <div className="collab-exec-card">
              <h4 className="collab-exec-card__title">Confirm advance received</h4>
              {commercials?.advance_receipt_url ? (
                <p className="collab-exec-card__muted">
                  Receipt on file: {commercials.advance_receipt_url}
                </p>
              ) : null}
              <Button
                disabled={busy || !commercials?.advance_receipt_url}
                onClick={() => void run(() => confirmManualAdvance(collaborationId))}
              >
                Confirm advance received
              </Button>
            </div>
          ) : null}

          {role === "CREATOR" && detail.thread.payoutMode !== "BARTER" ? (
            <div className="collab-exec-card">
              <h4 className="collab-exec-card__title">Payout profile</h4>
              <p className="collab-exec-card__muted">
                Save bank details for manual or settlement workflows.
              </p>
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() => {
                  setBusy(true);
                  onError("");
                  void upsertCreatorBankDetails({
                    account_holder: "Test Creator",
                    bank_name: "HDFC Bank",
                    account_number: "000123456789",
                    ifsc_or_routing: "HDFC0001234",
                  })
                    .then(() => onRefresh())
                    .catch((e) =>
                      onError(e instanceof Error ? e.message : "Could not save bank."),
                    )
                    .finally(() => setBusy(false));
                }}
              >
                Save bank profile (dev)
              </Button>
            </div>
          ) : null}
        </>
      ) : null}

      {stage === "STAGE_3_LOGISTICS" && !detail.thread.isTerminated ? (
        <>
          {role === "BRAND" ? (
            logisticsIsDispatched(detail) ? (
              <div className="collab-exec-card">
                <h4 className="collab-exec-card__title">Dispatched</h4>
                {detail.logistics?.trackingId ? (
                  <p className="collab-exec-card__body">
                    {detail.logistics.courierName ?? "Courier"} · {detail.logistics.trackingId}
                  </p>
                ) : null}
                {detail.logistics?.digitalAccessCredentials ? (
                  <p className="collab-exec-card__body">
                    Access: {detail.logistics.digitalAccessCredentials}
                  </p>
                ) : null}
                {detail.logistics?.redemptionCode ? (
                  <p className="collab-exec-card__body">
                    Code: {detail.logistics.redemptionCode}
                  </p>
                ) : null}
                <p className="collab-exec-card__muted">
                  Waiting for the creator to confirm receipt.
                </p>
              </div>
            ) : (
              <div className="collab-exec-card">
                <h4 className="collab-exec-card__title">Dispatch fulfillment</h4>
                {isD2cIndustry(detail.thread.industry) ? (
                  <>
                    <TextField
                      label="Tracking ID"
                      value={trackingId}
                      error={fieldErrors.trackingId}
                      onChange={(e) => setTrackingId(e.target.value)}
                    />
                    <TextField
                      label="Courier"
                      value={courierName}
                      onChange={(e) => setCourierName(e.target.value)}
                    />
                  </>
                ) : (
                  <>
                    <TextField
                      label="Digital access / instructions"
                      value={digitalAccess}
                      error={fieldErrors.digitalAccess}
                      onChange={(e) => setDigitalAccess(e.target.value)}
                    />
                    <TextField
                      label="Redemption code (optional)"
                      value={redemptionCode}
                      onChange={(e) => setRedemptionCode(e.target.value)}
                    />
                  </>
                )}
                <Button
                  disabled={busy || !canBrandDispatchLogistics(detail)}
                  onClick={() => {
                    if (isD2cIndustry(detail.thread.industry) && !trackingId.trim()) {
                      setFieldErrors({ trackingId: "Tracking ID is required for D2C." });
                      return;
                    }
                    if (
                      !isD2cIndustry(detail.thread.industry) &&
                      !digitalAccess.trim() &&
                      !redemptionCode.trim() &&
                      !trackingId.trim()
                    ) {
                      setFieldErrors({
                        digitalAccess: "Provide access instructions or a redemption code.",
                      });
                      return;
                    }
                    void run(() =>
                      dispatchCollaborationLogistics(collaborationId, {
                        tracking_id: trackingId.trim() || undefined,
                        courier_name: courierName.trim() || undefined,
                        digital_access_credentials: digitalAccess.trim() || undefined,
                        redemption_code: redemptionCode.trim() || undefined,
                      }),
                    );
                  }}
                >
                  Mark dispatched
                </Button>
              </div>
            )
          ) : (
            <div className="collab-exec-card">
              <h4 className="collab-exec-card__title">Confirm receipt</h4>
              {detail.logistics?.trackingId ? (
                <p className="collab-exec-card__muted">
                  Tracking: {detail.logistics.courierName} · {detail.logistics.trackingId}
                </p>
              ) : null}
              {detail.logistics?.digitalAccessCredentials ? (
                <p className="collab-exec-card__muted">
                  Access: {detail.logistics.digitalAccessCredentials}
                </p>
              ) : null}
              <div className="collab-exec-actions">
                <Button
                  disabled={busy || !canCreatorConfirmReceipt(detail)}
                  onClick={() =>
                    void run(() => confirmCollaborationReceipt(collaborationId))
                  }
                >
                  Confirm receipt / access
                </Button>
              </div>
              <TextField
                label="Report an issue"
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
              />
              <Button
                variant="secondary"
                disabled={busy || issueDescription.trim().length < 8}
                onClick={() =>
                  void run(() =>
                    reportFulfillmentIssue(collaborationId, {
                      issue_type: "DAMAGED",
                      description: issueDescription.trim(),
                    }),
                  )
                }
              >
                Report fulfillment issue
              </Button>
            </div>
          )}
        </>
      ) : null}

      {stage === "STAGE_4_CONTENT_REVIEW" && !detail.thread.isTerminated ? (
        <>
          {role === "CREATOR" ? (
            canCreatorSubmitMedia(detail) ? (
              <div className="collab-exec-card">
                <h4 className="collab-exec-card__title">Submit content</h4>
                <TextField
                  label="Media URL (draft)"
                  value={mediaUrl}
                  error={fieldErrors.mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                />
                <Button
                  disabled={busy}
                  onClick={() => {
                    const err = validateMediaUrl(mediaUrl);
                    if (err) {
                      setFieldErrors({ mediaUrl: err });
                      return;
                    }
                    void run(() =>
                      submitCollaborationMedia(collaborationId, {
                        media_url: mediaUrl.trim(),
                        phase: "MEDIA",
                      }),
                    );
                  }}
                >
                  Submit for review
                </Button>
              </div>
            ) : pendingMedia(detail) ? (
              <Alert tone="warning" title="Draft pending">
                Your submission is with the brand for review.
              </Alert>
            ) : null
          ) : (
            <div className="collab-exec-card">
              <h4 className="collab-exec-card__title">Review content</h4>
              {pendingMedia(detail) ? (
                <>
                  <p className="collab-exec-card__body">
                    <a href={pendingMedia(detail)!.mediaUrl} target="_blank" rel="noreferrer">
                      Open submitted draft (v{pendingMedia(detail)!.versionNumber})
                    </a>
                  </p>
                  <div className="collab-exec-actions">
                    <Button
                      disabled={busy}
                      onClick={() =>
                        void run(() =>
                          reviewCollaborationMedia(collaborationId, "APPROVED"),
                        )
                      }
                    >
                      Approve
                    </Button>
                    <Button
                      variant="secondary"
                      disabled={busy}
                      onClick={() =>
                        void run(() =>
                          reviewCollaborationMedia(
                            collaborationId,
                            "REJECTED",
                            "Please revise per brief feedback.",
                          ),
                        )
                      }
                    >
                      Request revision
                    </Button>
                  </div>
                </>
              ) : (
                <p className="collab-exec-card__muted">No pending submission yet.</p>
              )}
            </div>
          )}
        </>
      ) : null}

      {stage === "STAGE_5_PUBLISHING" && !detail.thread.isTerminated ? (
        <div className="collab-exec-card">
          <h4 className="collab-exec-card__title">Live post</h4>
          {role === "CREATOR" ? (
            detail.finalization?.livePostUrl ? (
              <p className="collab-exec-card__body">
                Submitted:{" "}
                <a href={detail.finalization.livePostUrl} target="_blank" rel="noreferrer">
                  {detail.finalization.livePostUrl}
                </a>
              </p>
            ) : (
              <>
                <TextField
                  label="Live URL (Instagram, TikTok, or YouTube)"
                  value={liveUrl}
                  error={fieldErrors.liveUrl}
                  onChange={(e) => setLiveUrl(e.target.value)}
                />
                <Button
                  disabled={busy}
                  onClick={() => {
                    const err = validateLivePostUrl(liveUrl);
                    if (err) {
                      setFieldErrors({ liveUrl: err });
                      return;
                    }
                    void run(() =>
                      submitCollaborationLivePost(collaborationId, liveUrl.trim()),
                    );
                  }}
                >
                  Submit live link
                </Button>
              </>
            )
          ) : (
            <>
              {detail.finalization?.livePostUrl ? (
                <p className="collab-exec-card__body">
                  <a href={detail.finalization.livePostUrl} target="_blank" rel="noreferrer">
                    {detail.finalization.livePostUrl}
                  </a>
                </p>
              ) : null}
              <Button
                disabled={busy || !detail.finalization?.livePostUrl}
                onClick={() =>
                  void run(() => verifyCollaborationCompliance(collaborationId))
                }
              >
                Verify compliance & release balance
              </Button>
            </>
          )}
        </div>
      ) : null}

      {stage === "STAGE_6_FEEDBACK_SYNC" && !detail.thread.isTerminated ? (
        <div className="collab-exec-card">
          <h4 className="collab-exec-card__title">Rate this collaboration</h4>
          {detail.finalization?.reviewsVisible ? (
            <p className="collab-exec-card__body">
              Brand: {detail.finalization.brandRating ?? "—"} · Creator:{" "}
              {detail.finalization.creatorRating ?? "—"}
            </p>
          ) : null}
          <TextField
            label="Rating (1–5)"
            value={rating}
            onChange={(e) => setRating(e.target.value)}
          />
          <TextField
            label="Review (optional)"
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
          />
          <Button
            disabled={
              busy ||
              (role === "BRAND" && detail.finalization?.brandRating != null) ||
              (role === "CREATOR" && detail.finalization?.creatorRating != null)
            }
            onClick={() =>
              void run(() =>
                submitCollaborationReview(collaborationId, {
                  rating: Math.min(5, Math.max(1, Number(rating) || 5)),
                  review_text: reviewText.trim() || undefined,
                }),
              )
            }
          >
            Submit rating
          </Button>
        </div>
      ) : null}
    </div>
  );
}
