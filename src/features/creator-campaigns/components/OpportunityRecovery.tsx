import { Link } from "react-router-dom";
import { useCreatorWorkspaceActorState } from "../../../shared/creator/creator-workspace-actor-context-value";
import { AUTH_ROUTES } from "../../auth/constants";
import { messageForReason } from "../utils/c03-errors";

export function OpportunityRecovery({
  reason,
  recoveryAction,
}: {
  reason: string;
  recoveryAction: string | null;
}) {
  const actor = useCreatorWorkspaceActorState();
  const instagram = [
    "NOT_CONNECTED",
    "REVALIDATION_REQUIRED",
    "RECONNECT_REQUIRED",
    "PROVIDER_BLOCKED_RECOVERABLE",
    "DISCONNECTED_IDENTITY_RETAINED",
  ].includes(reason);
  const settings =
    actor?.status === "READY" &&
    actor.actorContext.allowedActions.includes("INSTAGRAM_SETTINGS_MANAGE") &&
    actor.actorContext.allowedActions.includes("INSTAGRAM_SETTINGS_READ");
  return (
    <section className="cc-detail-panel">
      <h2>Opportunity access</h2>
      <p role="status">{messageForReason(reason)}</p>
      {instagram &&
        recoveryAction &&
        (settings ? (
          <Link
            className="aurora-button aurora-button--outline"
            to={AUTH_ROUTES.creatorSettingsInstagram}
          >
            Open Instagram Settings
          </Link>
        ) : (
          <p>
            Ask your workspace Owner or Manager to manage the Instagram
            connection.
          </p>
        ))}
      {actor?.status === "READY" && (
        <p>
          <Link to={AUTH_ROUTES.creatorApplications}>My Applications</Link>{" "}
          remains available with current Team access.
        </p>
      )}
    </section>
  );
}
