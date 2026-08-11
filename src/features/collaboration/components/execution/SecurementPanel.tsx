import { Button } from "../../../../design-system/aurora";
import type { UserRole } from "../../../../shared/auth/user-role";
import type { CollaborationDetailResponse } from "../../contracts/collaboration.contracts";
import { collaborationCapabilities } from "../../utils/collaboration-capabilities";
import { formatCommercialAmount } from "../../utils/collaboration-commercial-display";

type Props = { detail: CollaborationDetailResponse; role: UserRole; busyAction: string | null; onFund: () => void; onManagePayoutDetails: () => void };
export function SecurementPanel({ detail, role, busyAction, onFund, onManagePayoutDetails }: Props) {
  const capabilities = collaborationCapabilities(detail); const commercial = detail.commercial; const securement = detail.securement;
  const state = securement?.state ?? "NOT_REQUIRED"; const isBrand = role === "BRAND"; const zeroCash = state === "NOT_REQUIRED" || securement?.requiredSecuredAmount === 0;
  const stateCopy = (() => {
    switch (state) {
      case "AWAITING_ESCROW_FUNDING": return isBrand ? "Secure the full agreed Creator fee in escrow before execution begins." : "Waiting for the Brand to secure funds.";
      case "PROCESSING_FUNDING": return "Funding processing. We’ll update this collaboration when securement is confirmed.";
      case "AWAITING_PAYOUT_DETAILS": return role === "CREATOR" ? "Add or update your payout details to continue." : "Waiting for the Creator to add payout details.";
      case "COMPLETED": return "Funds secured. The collaboration can now proceed.";
      case "PAYMENT_DISPUTED": case "BLOCKED": return "Securement is under review. Follow the action guidance above.";
      case "AWAITING_BRAND_PAYMENT": case "AWAITING_CREATOR_CONFIRMATION": return "Payment confirmation is pending.";
      default: return "No cash securement required.";
    }
  })();
  return <section className="collab-exec-card" aria-labelledby="collab-securement-title">
    <h4 id="collab-securement-title">Securement</h4>
    <dl className="collab-facts">
      <div><dt>Agreed Creator fee</dt><dd>{formatCommercialAmount(commercial?.agreedCreatorFee, commercial?.currency)}</dd></div>
      <div><dt>Amount to secure</dt><dd>{zeroCash ? "None" : formatCommercialAmount(securement?.requiredSecuredAmount, securement?.currency)}</dd></div>
      <div><dt>Advance protection</dt><dd>{commercial?.advancePercentage ?? 0}%</dd></div>
      {commercial?.platformCommissionAmount != null ? <div><dt>Platform commission</dt><dd>{formatCommercialAmount(commercial.platformCommissionAmount, commercial.currency)}</dd></div> : null}
      {commercial?.platformCommissionGstAmount != null ? <div><dt>GST on platform commission</dt><dd>{formatCommercialAmount(commercial.platformCommissionGstAmount, commercial.currency)}</dd></div> : null}
    </dl>
    <p role="status">{stateCopy}</p>
    <div className="collab-exec-actions" aria-busy={busyAction !== null}>
      {capabilities.has("fund-escrow") && securement?.paymentRail === "PLATFORM_ESCROW" && !zeroCash ? <Button disabled={busyAction !== null} onClick={onFund} fullWidthOnMobile>{busyAction === "fund-escrow" ? "Starting funding…" : "Fund collaboration"}</Button> : null}
      {state === "AWAITING_PAYOUT_DETAILS" && role === "CREATOR" ? <Button variant="secondary" disabled={busyAction !== null} onClick={onManagePayoutDetails} fullWidthOnMobile>Manage payout details</Button> : null}
    </div>
  </section>;
}
