import { useId, useRef, useState } from "react";
import { Button } from "../../../design-system/aurora";
import { CampaignError, fetchCreatorBriefPack } from "../api/c03-client";
import { useCampaignScope } from "../hooks/campaign-scope-context";

export function BriefPackDownload({
  applicationId,
}: {
  applicationId: string;
}) {
  const scope = useCampaignScope(),
    messageId = useId();
  const pending = useRef(false);
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState<string | null>(null),
    [failed, setFailed] = useState(false);
  async function download() {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setMessage("Loading Creator Brief Pack…");
    setFailed(false);
    let phase = "fetch";
    try {
      const pack = await fetchCreatorBriefPack(scope, applicationId);
      scope.assertCurrent();
      phase = "pdf";
      setMessage("Creating your PDF…");
      const { renderCreatorBriefPack, downloadCreatorBriefPack } = await import(
        "../pdf/creator-brief-pack"
      );
      scope.assertCurrent();
      const pdf = renderCreatorBriefPack(pack);
      scope.assertCurrent();
      await downloadCreatorBriefPack(pdf, () => scope.assertCurrent());
      scope.assertCurrent();
      setMessage("Creator Brief Pack downloaded.");
    } catch (error) {
      if (!scope.signal.aborted) {
        setFailed(true);
        setMessage(
          error instanceof CampaignError &&
            error.code === "APPLICATION_BRIEF_PACK_UNAVAILABLE"
            ? "The historical downloadable pack is unavailable for this Application."
            : error instanceof CampaignError && error.status === 404
              ? "This Application is unavailable for the current workspace."
              : error instanceof CampaignError && error.status === 401
                ? "Your session ended. Sign in again."
                : error instanceof CampaignError && error.status === 403
                  ? "Your Creator workspace access changed. Reload to verify access."
                  : phase === "pdf"
                    ? "The PDF could not be created. Try again."
                    : "The Creator Brief Pack could not be verified or downloaded. Try again.",
        );
      }
    } finally {
      pending.current = false;
      if (!scope.signal.aborted) setBusy(false);
    }
  }
  return (
    <section aria-label="Creator Brief Pack">
      <Button
        type="button"
        disabled={busy}
        aria-busy={busy}
        aria-describedby={message ? messageId : undefined}
        onClick={() => void download()}
      >
        Download Brief
      </Button>
      {message && (
        <p id={messageId} role={failed ? "alert" : "status"}>
          {message}
        </p>
      )}
    </section>
  );
}
