import { AUTH_ROUTES } from "../../auth/constants";
import type { CreatorHomeDestination } from "../contracts/creator-home.schemas";

function withEntity(
  template: string,
  token: string,
  entityId: string | undefined,
): string | null {
  return entityId
    ? template.replace(token, encodeURIComponent(entityId))
    : null;
}

export function resolveCreatorHomeDestination(
  destination: CreatorHomeDestination,
): string | null {
  switch (destination.destinationId) {
    case "CREATOR_CAMPAIGNS":
      return AUTH_ROUTES.creatorOpportunities;
    case "CREATOR_OPPORTUNITY_DETAIL":
      return withEntity(
        AUTH_ROUTES.creatorOpportunity,
        ":campaignId",
        destination.entityId,
      );
    case "CREATOR_APPLICATIONS":
      return AUTH_ROUTES.creatorApplications;
    case "CREATOR_APPLICATION_DETAIL":
      return withEntity(
        AUTH_ROUTES.creatorApplication,
        ":applicationId",
        destination.entityId,
      );
    case "CREATOR_COLLABORATIONS":
      return AUTH_ROUTES.creatorCollaborations;
    case "CREATOR_COLLABORATION_THREAD":
      return destination.entityId
        ? `${AUTH_ROUTES.creatorCollaborations}?${new URLSearchParams({ thread: destination.entityId }).toString()}`
        : null;
    case "CREATOR_SETTINGS":
      return AUTH_ROUTES.creatorSettings;
    case "CREATOR_SETTINGS_INSTAGRAM":
      return AUTH_ROUTES.creatorSettingsInstagram;
  }
}
