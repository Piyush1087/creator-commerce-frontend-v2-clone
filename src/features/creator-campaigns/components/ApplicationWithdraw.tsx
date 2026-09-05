import { useRef, useState } from "react";
import { Button, SideDrawer } from "../../../design-system/aurora";
import {
  CampaignError,
  commandKey,
  withdrawApplication,
} from "../api/c03-client";
import type { ApplicationDetail } from "../contracts/c03.contracts";
import { messageForError } from "../utils/c03-errors";
import { useCampaignScope } from "./CampaignAuthority";
import { assetName } from "./CampaignContent";

export function ApplicationWithdraw({
  application,
  onClose,
  onRefresh,
  onWithdrawn,
}: {
  application: ApplicationDetail;
  onClose: () => void;
  onRefresh: () => void;
  onWithdrawn: () => void;
}) {
  const scope = useCampaignScope();
  const cancel = useRef<HTMLButtonElement>(null);
  const inFlight = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const submit = async () => {
    if (
      inFlight.current ||
      !application.canWithdrawPending ||
      application.status !== "PENDING"
    )
      return;
    inFlight.current = true;
    setBusy(true);
    setError(null);
    const intent = `withdraw:${application.applicationId}:${application.statusVersion}`;
    try {
      await withdrawApplication(
        scope,
        application.applicationId,
        scope.command(intent, commandKey),
      );
      scope.assertCurrent();
      scope.finishCommand(intent);
      onWithdrawn();
    } catch (failure) {
      if (!scope.signal.aborted) {
        setError(failure);
        if (!(failure instanceof CampaignError) || !failure.uncertain)
          scope.finishCommand(intent);
      }
    } finally {
      inFlight.current = false;
      if (!scope.signal.aborted) setBusy(false);
    }
  };
  const uncertain = error instanceof CampaignError && error.uncertain;
  return (
    <SideDrawer
      isOpen
      title="Withdraw this Application?"
      initialFocusRef={cancel}
      onClose={() => {
        if (!inFlight.current) onClose();
      }}
      footer={
        <>
          <button
            ref={cancel}
            type="button"
            className="aurora-button aurora-button--outline"
            disabled={busy}
            onClick={onClose}
          >
            Keep Application
          </button>
          <Button
            disabled={busy || (!!error && !uncertain)}
            onClick={() => void submit()}
          >
            {busy
              ? "Withdrawing…"
              : uncertain
                ? "Retry same Withdraw"
                : "Confirm Withdraw"}
          </Button>
        </>
      }
    >
      <div className="c03-content">
        <p>This withdraws only the following pending Application.</p>
        <h3>{application.campaign.name ?? "Campaign"}</h3>
        <p>
          Asset:{" "}
          {application.asset.kind
            ? assetName({ ...application.asset, kind: application.asset.kind })
            : "Not provided"}
        </p>
        <p>Brief: {application.brief.briefName ?? "Not provided"}</p>
        <p>Application {application.applicationId}</p>
        {busy && (
          <p role="status">Waiting for the server to confirm Withdraw…</p>
        )}
        {!!error && (
          <div role="alert">
            <p>{messageForError(error)}</p>
            {!uncertain && (
              <Button variant="outline" onClick={onRefresh}>
                Refresh Application
              </Button>
            )}
          </div>
        )}
      </div>
    </SideDrawer>
  );
}
