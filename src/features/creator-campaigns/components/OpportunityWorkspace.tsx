import { useCallback, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "../../../design-system/aurora";
import { logoutCurrentSession } from "../../auth/api/auth-client";
import { continueApplication, fetchOpportunity } from "../api/c03-client";
import type { CampaignScope } from "../api/c03-scope";
import { exchangeCampaignEntry } from "../api/c03-entry";
import { idSchema } from "../contracts/c03.contracts";
import { useCampaignResource } from "../hooks/use-c03-resource";
import { messageForError } from "../utils/c03-errors";
import { useCampaignScope } from "../hooks/campaign-scope-context";
import { CampaignUnavailable } from "./CampaignCompatibility";
import { OpportunityDossier } from "./OpportunityDossier";
import { OpportunityRecovery } from "./OpportunityRecovery";

export function OpportunityWorkspace() {
  const { campaignId } = useParams();
  return idSchema.safeParse(campaignId).success ? (
    <OpportunityResource key={campaignId} campaignId={campaignId!} />
  ) : (
    <CampaignUnavailable />
  );
}
function OpportunityResource({ campaignId }: { campaignId: string }) {
  const scope = useCampaignScope();
  const load = useCallback(
    async (s: CampaignScope) => {
      await exchangeCampaignEntry(s, campaignId);
      return fetchOpportunity(s, campaignId);
    },
    [campaignId],
  );
  const resource = useCampaignResource(load);
  const [entryReady, setEntryReady] = useState(false);
  const [entryBusy, setEntryBusy] = useState(false);
  const [entryError, setEntryError] = useState<unknown>(null);
  const prepare = async () => {
    setEntryBusy(true);
    setEntryError(null);
    try {
      await continueApplication(scope, campaignId);
      scope.assertCurrent();
      setEntryReady(true);
    } catch (error) {
      if (!scope.signal.aborted) setEntryError(error);
    } finally {
      if (!scope.signal.aborted) setEntryBusy(false);
    }
  };
  if (resource.loading && !resource.data)
    return (
      <section>
        <h1>Campaign opportunity</h1>
        <p role="status">Loading opportunity…</p>
      </section>
    );
  if (!resource.data)
    return (
      <section>
        <h1>Campaign opportunity</h1>
        <p role="alert">{messageForError(resource.error)}</p>
        <Button onClick={() => void resource.refresh()}>Retry</Button>
      </section>
    );
  const data = resource.data;
  if (data.state === "AUTHORIZED")
    return (
      <OpportunityDossier
        opportunity={data}
        refresh={() => void resource.refresh()}
      />
    );
  if (data.state === "LOCKED")
    return (
      <section className="c03-content">
        <h1>Campaign opportunity</h1>
        <OpportunityRecovery
          reason={data.reason}
          recoveryAction={data.recoveryAction}
        />
        <Button variant="outline" onClick={() => void resource.refresh()}>
          Refresh access
        </Button>
      </section>
    );
  const from = `/campaigns/${campaignId}`;
  if (data.reason === "CREATOR_ACCOUNT_REQUIRED")
    return (
      <section className="c03-content">
        <h1>{data.campaign.name}</h1>
        <p>Use a Creator account to continue.</p>
        <Button
          onClick={() => void logoutCurrentSession().catch(setEntryError)}
        >
          Sign out to use a Creator account
        </Button>
        {!!entryError && (
          <p role="alert">Sign out could not be completed. Try again.</p>
        )}
      </section>
    );
  return (
    <section className="c03-content">
      <h1>{data.campaign.name}</h1>
      <p>{data.campaign.platforms.join(" · ")}</p>
      <p>
        Sign in or create a Creator account to check access to this opportunity.
      </p>
      {!!entryError && <p role="alert">{messageForError(entryError)}</p>}
      {entryReady ? (
        <div className="cc-detail-cta-row">
          <Link
            className="aurora-button aurora-button--primary"
            to="/login"
            state={{ from }}
          >
            Sign in
          </Link>
          <Link
            className="aurora-button aurora-button--outline"
            to="/creator/onboarding/signup"
            state={{ from }}
          >
            Create Creator account
          </Link>
        </div>
      ) : (
        <Button disabled={entryBusy} onClick={() => void prepare()}>
          {entryBusy
            ? "Preparing secure entry…"
            : "Continue to sign in or create account"}
        </Button>
      )}
    </section>
  );
}
