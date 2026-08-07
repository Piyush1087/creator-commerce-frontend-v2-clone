import { CheckCircle } from "lucide-react";

import { Card } from "../../../design-system/aurora";

/** Placeholder invitee completion screen — no app nav, Aurora card. */
export function SocialSyncCompleteView() {
  return (
    <div className="bob-verify bob-verify--hide-nav">
      <div className="bob-container" style={{ maxWidth: 520, margin: "4rem auto" }}>
        <Card className="bob-verify__card bob-verify__card--success">
          <div className="bob-verify__success-icon">
            <CheckCircle size={40} strokeWidth={1.5} />
          </div>
          <h1 className="bob-verify__title bob-verify__title--centered">
            Integration Successfully Established!
          </h1>
          <p className="bob-verify__lead bob-verify__lead--centered">
            Thank you for your assistance. The secure Instagram Graph API token has been committed.
            Your temporary administrative agent session is closed. You may safely close this browser
            tab.
          </p>
        </Card>
      </div>
    </div>
  );
}
