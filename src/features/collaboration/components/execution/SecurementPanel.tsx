import { ShieldCheck } from "lucide-react";
import { Button } from "../../../../design-system/aurora";
import type { UserRole } from "../../../../shared/auth/user-role";
import type { CollaborationDetailResponse } from "../../contracts/collaboration.contracts";
import { collaborationCapabilities } from "../../utils/collaboration-capabilities";
import { formatCommercialAmount } from "../../utils/collaboration-commercial-display";
import { actionRequiredLabel } from "../../utils/stage-labels";

type Props = {
  detail: CollaborationDetailResponse;
  role: UserRole;
  busyAction: string | null;
  onFund: () => void;
  onManagePayoutDetails: () => void;
};
export function SecurementPanel({
  detail,
  role,
  busyAction,
  onFund,
  onManagePayoutDetails,
}: Props) {
  const capabilities = collaborationCapabilities(detail);
  const commercial = detail.commercial;
  const securement = detail.securement;
  const state = securement?.state ?? "NOT_REQUIRED";
  const isBrand = role === "BRAND";
  const zeroCash =
    state === "NOT_REQUIRED" || securement?.requiredSecuredAmount === 0;
  const stateCopy = (() => {
    switch (state) {
      case "AWAITING_ESCROW_FUNDING":
        return isBrand
          ? "Secure the full commercial reserve before execution begins."
          : "Waiting for the Brand to secure the commercial reserve.";
      case "PROCESSING_FUNDING":
        return "Funding processing. We’ll update this collaboration when securement is confirmed.";
      case "AWAITING_PAYOUT_DETAILS":
        return role === "CREATOR"
          ? "Add or update your payout details to continue."
          : "Waiting for the Creator to add payout details.";
      case "COMPLETED":
        return "Funds secured. The collaboration can now proceed.";
      case "PAYMENT_DISPUTED":
      case "BLOCKED":
        return "Securement is under review. Follow the action guidance above.";
      case "AWAITING_BRAND_PAYMENT":
      case "AWAITING_CREATOR_CONFIRMATION":
        return "Payment confirmation is pending.";
      default:
        return "No cash securement required.";
    }
  })();
  const amountToSecure = zeroCash
    ? "None"
    : formatCommercialAmount(
        securement?.requiredSecuredAmount,
        securement?.currency,
      );

  return (
    <section
      className="collab-exec-card collab-stage-card collab-securement"
      aria-labelledby="collab-securement-title"
    >
      <header className="collab-stage-card__header">
        <span className="collab-stage-card__icon" aria-hidden="true">
          <ShieldCheck size={20} />
        </span>
        <div>
          <p className="collab-stage-card__eyebrow">Protected funding</p>
          <h4 id="collab-securement-title">Securement</h4>
        </div>
        <span className="collab-stage-card__status">
          {actionRequiredLabel(detail.workflow.actionRequiredBy)}
        </span>
      </header>

      <p className="collab-stage-card__lead" role="status">
        {stateCopy}
      </p>

      <section className="collab-amount-card" aria-label="Amount to secure">
        <span>Amount to secure</span>
        <strong>{amountToSecure}</strong>
      </section>

      <dl className="collab-facts collab-facts--stage">
        <div>
          <dt>Agreed Creator fee</dt>
          <dd>
            {formatCommercialAmount(
              commercial?.agreedCreatorFee,
              commercial?.currency,
            )}
          </dd>
        </div>
        {commercial?.advancePercentage != null ? (
          <div>
            <dt>Advance protection</dt>
            <dd>{commercial.advancePercentage}%</dd>
          </div>
        ) : null}
        {commercial?.platformCommissionAmount != null ? (
          <div>
            <dt>Platform commission</dt>
            <dd>
              {formatCommercialAmount(
                commercial.platformCommissionAmount,
                commercial.currency,
              )}
            </dd>
          </div>
        ) : null}
        {commercial?.platformCommissionGstAmount != null ? (
          <div>
            <dt>GST on platform commission</dt>
            <dd>
              {formatCommercialAmount(
                commercial.platformCommissionGstAmount,
                commercial.currency,
              )}
            </dd>
          </div>
        ) : null}
      </dl>

      <div
        className="collab-exec-actions collab-stage-actions"
        aria-busy={busyAction !== null}
      >
        {capabilities.has("fund-escrow") &&
        securement?.paymentRail === "PLATFORM_ESCROW" &&
        !zeroCash ? (
          <Button
            className="collab-stage-actions__primary"
            disabled={busyAction !== null}
            onClick={onFund}
            fullWidthOnMobile
          >
            {busyAction === "fund-escrow"
              ? "Starting funding…"
              : "Fund collaboration"}
          </Button>
        ) : null}
        {state === "AWAITING_PAYOUT_DETAILS" && role === "CREATOR" ? (
          <div className="collab-stage-prerequisite">
            <p>Your payout details are managed in Settings.</p>
            <Button
              variant="secondary"
              disabled={busyAction !== null}
              onClick={onManagePayoutDetails}
              fullWidthOnMobile
            >
              Manage payout details
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
