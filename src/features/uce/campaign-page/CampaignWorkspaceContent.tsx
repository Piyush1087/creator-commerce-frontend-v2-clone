import { Button } from "../../../design-system/aurora";
import { discoveryCreatorContextLabel } from "./campaign-page-model";
import { isTerminalApplicationStatus } from "./campaign-page-presentation";
import { CreatorCard } from "./CreatorCard";
import type { ApplicantsWorkspaceView, DiscoveryWorkspaceView } from "./types";
import { WorkspaceStatePanel } from "./WorkspaceStatePanel";

export function DiscoveryWorkspaceContent({
  discovery,
  error,
  busy,
  onRetry,
  onOpenProfile,
  onOpenOutreach,
}: {
  discovery?: DiscoveryWorkspaceView;
  error?: string;
  busy: boolean;
  onRetry: () => void;
  onOpenProfile: (campaignCreatorId: string) => void;
  onOpenOutreach: (campaignCreatorId: string) => void;
}) {
  if (error) {
    return (
      <WorkspaceStatePanel
        action={
          <Button onClick={onRetry} size="sm" variant="outline">
            Retry Discovery
          </Button>
        }
        kind="error"
        title="Discovery could not be loaded"
      >
        <p>{error}</p>
      </WorkspaceStatePanel>
    );
  }

  if (!discovery) {
    return (
      <WorkspaceStatePanel kind="loading" title="Loading Discovery">
        <p>
          Loading saved Campaign creator context. No records are shown until the
          request completes.
        </p>
      </WorkspaceStatePanel>
    );
  }

  return (
    <div className="canonical-campaign-page__workspace-content">
      <WorkspaceStatePanel
        kind="unavailable"
        title="Recommendation provider unavailable"
      >
        <p>{discovery.provider.message}</p>
      </WorkspaceStatePanel>

      {discovery.state === "UNAVAILABLE" ? (
        <WorkspaceStatePanel kind="unavailable" title="Discovery unavailable">
          <p>Discovery is unavailable; this is not an empty creator result.</p>
        </WorkspaceStatePanel>
      ) : discovery.state === "EMPTY" ? (
        <WorkspaceStatePanel kind="empty" title="No saved Campaign prospects">
          <p>
            The saved Campaign creator query completed successfully without
            records.
          </p>
        </WorkspaceStatePanel>
      ) : discovery.state === "ERROR" ? (
        <WorkspaceStatePanel
          action={
            <Button onClick={onRetry} size="sm" variant="outline">
              Retry Discovery
            </Button>
          }
          kind="error"
          title="Discovery could not be loaded"
        >
          <p>Retry the saved Campaign creator request.</p>
        </WorkspaceStatePanel>
      ) : (
        <>
          <WorkspaceStatePanel
            kind="compatibility"
            title="Saved Campaign creator context"
          >
            <p>{discoveryCreatorContextLabel(discovery)}</p>
          </WorkspaceStatePanel>
          <div className="canonical-campaign-page__workspace-records">
            {discovery.creators.map((creator) => (
              <CreatorCard
                key={creator.campaignCreatorId}
                avatarInitials={creator.avatarInitials}
                busy={busy}
                category={creator.category}
                contextLabel={creator.contextLabel}
                engagement={creator.engagement}
                followers={creator.followers}
                name={creator.name}
                onPrimaryAction={() =>
                  onOpenOutreach(creator.campaignCreatorId)
                }
                onSecondaryAction={() =>
                  onOpenProfile(creator.campaignCreatorId)
                }
                primaryActionLabel="Outreach"
                secondaryActionLabel="Profile"
                variant="discovery"
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function ApplicantsWorkspaceContent({
  applicants,
  error,
  busy,
  onRetry,
  onApprove,
  onReject,
  onOpenProfile,
}: {
  applicants?: ApplicantsWorkspaceView;
  error?: string;
  busy: boolean;
  onRetry: () => void;
  onApprove: (applicationId: string) => void;
  onReject: (applicationId: string) => void;
  onOpenProfile: (campaignCreatorId: string) => void;
}) {
  if (error) {
    return (
      <WorkspaceStatePanel
        action={
          <Button onClick={onRetry} size="sm" variant="outline">
            Retry Applicants
          </Button>
        }
        kind="error"
        title="Applicants could not be loaded"
      >
        <p>{error}</p>
      </WorkspaceStatePanel>
    );
  }

  if (!applicants) {
    return (
      <WorkspaceStatePanel kind="loading" title="Loading Applicants">
        <p>Loading the Campaign decision queue without optimistic records.</p>
      </WorkspaceStatePanel>
    );
  }

  if (applicants.state === "UNAVAILABLE") {
    return (
      <WorkspaceStatePanel kind="unavailable" title="Applicants unavailable">
        <p>Applicants are unavailable; this is not an empty decision queue.</p>
      </WorkspaceStatePanel>
    );
  }

  if (applicants.state === "ERROR") {
    return (
      <WorkspaceStatePanel
        action={
          <Button onClick={onRetry} size="sm" variant="outline">
            Retry Applicants
          </Button>
        }
        kind="error"
        title="Applicants could not be loaded"
      >
        <p>Retry the Campaign Application request.</p>
      </WorkspaceStatePanel>
    );
  }

  if (applicants.state === "EMPTY" || applicants.applicants.length === 0) {
    return (
      <WorkspaceStatePanel kind="empty" title="No applicants yet">
        <p>Creator Applications will appear here after they are submitted.</p>
      </WorkspaceStatePanel>
    );
  }

  const hasCompatibilityReferences = applicants.applicants.some(
    (applicant) => applicant.referenceAuthority === "LEGACY_COMPATIBILITY",
  );

  return (
    <div className="canonical-campaign-page__workspace-content">
      {hasCompatibilityReferences ? (
        <WorkspaceStatePanel
          kind="compatibility"
          title="Legacy Application references"
        >
          <p>
            Compatibility references remain legacy data; no canonical Campaign
            Asset or Brief lineage is inferred.
          </p>
        </WorkspaceStatePanel>
      ) : null}
      <div className="canonical-campaign-page__workspace-records">
        {applicants.applicants.map((applicant) => {
          const terminal = isTerminalApplicationStatus(
            applicant.applicationStatus,
          );
          const actionable =
            !applicant.applicationStatus ||
            applicant.applicationStatus === "PENDING";
          return (
            <CreatorCard
              key={applicant.applicationId}
              applicationStatus={applicant.applicationStatus}
              avatarInitials={applicant.avatarInitials}
              busy={busy}
              category={applicant.category}
              compatibility={
                applicant.referenceAuthority === "LEGACY_COMPATIBILITY"
              }
              engagement={applicant.engagement}
              followers={applicant.followers}
              intelligenceLabel={applicant.intelligenceLabel}
              intelligenceStatus={applicant.intelligenceStatus}
              name={applicant.name}
              onPrimaryAction={
                actionable
                  ? () => onApprove(applicant.applicationId)
                  : undefined
              }
              onSecondaryAction={
                actionable ? () => onReject(applicant.applicationId) : undefined
              }
              onTertiaryAction={() =>
                onOpenProfile(applicant.campaignCreatorId)
              }
              primaryActionLabel={actionable ? "Approve" : undefined}
              secondaryActionLabel={actionable ? "Reject" : undefined}
              terminal={terminal}
              tertiaryActionLabel="Profile"
              variant="applicant"
            />
          );
        })}
      </div>
    </div>
  );
}

export function CollaborationWorkspaceContent({
  state,
  count,
}: {
  state: "READY" | "EMPTY" | "ERROR";
  count?: number;
}) {
  if (state === "EMPTY") {
    return (
      <WorkspaceStatePanel kind="empty" title="No Collaboration references">
        <p>
          No Collaboration references are associated with this Campaign yet.
        </p>
      </WorkspaceStatePanel>
    );
  }

  if (state === "ERROR") {
    return (
      <WorkspaceStatePanel
        kind="error"
        title="Collaboration references unavailable"
      >
        <p>The projected Collaboration context could not be rendered.</p>
      </WorkspaceStatePanel>
    );
  }

  return (
    <WorkspaceStatePanel kind="reference" title="Collaboration references">
      <p>
        {count ?? 0} Collaboration reference{count === 1 ? " is" : "s are"}{" "}
        available. Campaign Page does not own Collaboration lifecycle or
        workflow controls.
      </p>
    </WorkspaceStatePanel>
  );
}
