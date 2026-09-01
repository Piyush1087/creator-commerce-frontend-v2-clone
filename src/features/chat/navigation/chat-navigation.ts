import { AUTH_ROUTES } from "../../auth/constants";
import { resolveSafeInternalPath } from "../../../shared/navigation/safe-internal-path";
import type { ChatGroundedResponse } from "../contracts/chat.schemas";

type ChatNavigation = NonNullable<ChatGroundedResponse["navigation"]>;

export class UnsafeChatNavigationError extends Error {
  constructor() {
    super("Creator Shop could not open that destination safely.");
    this.name = "UnsafeChatNavigationError";
  }
}

function safeEntityPath(pattern: string, id: string): string {
  const encodedId = encodeURIComponent(id);
  const candidate = pattern.replace(/:[^/]+/u, encodedId);
  const resolved = resolveSafeInternalPath(
    candidate,
    AUTH_ROUTES.brandDashboard,
  );
  if (resolved !== candidate) throw new UnsafeChatNavigationError();
  return resolved;
}

export function resolveChatNavigation(navigation: ChatNavigation): string {
  let candidate: string;

  switch (navigation.destinationId) {
    case "HOME":
      if (navigation.entityRef) throw new UnsafeChatNavigationError();
      candidate = AUTH_ROUTES.brandDashboard;
      break;
    case "BRAND_CENTRE":
      if (navigation.entityRef) throw new UnsafeChatNavigationError();
      candidate = AUTH_ROUTES.brandCentre;
      break;
    case "OFFERINGS":
      if (!navigation.entityRef) {
        candidate = AUTH_ROUTES.brandCentreOfferings;
        break;
      }
      if (navigation.entityRef.type !== "OFFERING") {
        throw new UnsafeChatNavigationError();
      }
      return safeEntityPath(
        AUTH_ROUTES.brandCentreOfferingDetail,
        navigation.entityRef.id,
      );
    case "CAMPAIGNS":
      if (!navigation.entityRef) {
        candidate = AUTH_ROUTES.brandUceCampaigns;
        break;
      }
      if (navigation.entityRef.type !== "CAMPAIGN") {
        throw new UnsafeChatNavigationError();
      }
      return safeEntityPath(
        AUTH_ROUTES.brandUceCampaignDetail,
        navigation.entityRef.id,
      );
  }

  const resolved = resolveSafeInternalPath(
    candidate,
    AUTH_ROUTES.brandDashboard,
  );
  if (resolved !== candidate) throw new UnsafeChatNavigationError();
  return resolved;
}
