import { Button } from "../../../../design-system/aurora";
import type { CollaborationDetailResponse } from "../../contracts/collaboration.contracts";
import { collaborationCapabilities } from "../../utils/collaboration-capabilities";
export function SecurementPanel({ detail, busy, onFund }: { detail: CollaborationDetailResponse; busy: boolean; onFund: () => void }) {
  const capabilities = collaborationCapabilities(detail); const commercial = detail.commercial; const securement = detail.securement;
  return <section className="collab-exec-card"><h4>Securement</h4>
    <dl className="collab-facts"><div><dt>Agreed Creator fee</dt><dd>{commercial?.currency} {commercial?.agreedCreatorFee ?? 0}</dd></div><div><dt>Amount to secure</dt><dd>{securement?.currency} {securement?.requiredSecuredAmount ?? 0}</dd></div><div><dt>Advance protection</dt><dd>{commercial?.advancePercentage ?? 0}%</dd></div></dl>
    <p>{securement?.state ?? "No cash securement required."}</p>
    {capabilities.has("fund-escrow") ? <Button disabled={busy} onClick={onFund}>Fund collaboration</Button> : null}
  </section>;
}
