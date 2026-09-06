import { AUTH_ROUTES, collaborationsThreadUrl } from "../constants";
import { resolveSafeInternalPath } from "../../../shared/navigation/safe-internal-path";

type BrandDestinationId =
  | "HOME"
  | "BRAND_CENTRE"
  | "OFFERINGS"
  | "CAMPAIGNS"
  | "COLLABORATIONS"
  | "SETTINGS"
  | "SETTINGS_INTEGRATIONS"
  | "SETTINGS_BILLING";

type BrandEntityType =
  | "BRAND"
  | "OFFERING"
  | "CAMPAIGN"
  | "COLLABORATION"
  | "SETTINGS"
  | "PROVIDER";

export type BrandDestinationNavigation = Readonly<{
  destinationId: BrandDestinationId;
  entityRef?: Readonly<{ type: BrandEntityType; id: string }>;
}>;

export class UnsafeBrandDestinationError extends Error {
  constructor() {
    super("Creator Shop could not open that destination safely.");
    this.name = "UnsafeBrandDestinationError";
  }
}

function safeEntityPath(pattern: string, id: string): string {
  const encodedId = encodeURIComponent(id);
  const candidate = pattern.replace(/:[^/]+/u, encodedId);
  const resolved = resolveSafeInternalPath(
    candidate,
    AUTH_ROUTES.brandDashboard,
  );
  if (resolved !== candidate) throw new UnsafeBrandDestinationError();
  return resolved;
}

function withoutEntity(
  navigation: BrandDestinationNavigation,
  route: string,
): string {
  if (navigation.entityRef) throw new UnsafeBrandDestinationError();
  return route;
}

export function resolveBrandDestinationNavigation(
  navigation: BrandDestinationNavigation,
): string {
  let candidate: string;

  switch (navigation.destinationId) {
    case "HOME":
      candidate = withoutEntity(navigation, AUTH_ROUTES.brandDashboard);
      break;
    case "BRAND_CENTRE":
      if (
        navigation.entityRef &&
        navigation.entityRef.type !== "BRAND"
      ) {
        throw new UnsafeBrandDestinationError();
      }
      candidate = AUTH_ROUTES.brandCentre;
      break;
    case "OFFERINGS":
      if (!navigation.entityRef) {
        candidate = AUTH_ROUTES.brandCentreOfferings;
        break;
      }
      if (navigation.entityRef.type !== "OFFERING") {
        throw new UnsafeBrandDestinationError();
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
        throw new UnsafeBrandDestinationError();
      }
      return safeEntityPath(
        AUTH_ROUTES.brandUceCampaignDetail,
        navigation.entityRef.id,
      );
    case "COLLABORATIONS":
      if (!navigation.entityRef) {
        candidate = AUTH_ROUTES.brandCollaborations;
        break;
      }
      if (navigation.entityRef.type !== "COLLABORATION") {
        throw new UnsafeBrandDestinationError();
      }
      candidate = collaborationsThreadUrl(navigation.entityRef.id);
      break;
    case "SETTINGS":
      candidate = withoutEntity(navigation, AUTH_ROUTES.brandSettings);
      break;
    case "SETTINGS_INTEGRATIONS":
      candidate = withoutEntity(
        navigation,
        AUTH_ROUTES.brandSettingsIntegrations,
      );
      break;
    case "SETTINGS_BILLING":
      candidate = withoutEntity(navigation, AUTH_ROUTES.brandSettingsBilling);
      break;
  }

  const resolved = resolveSafeInternalPath(
    candidate,
    AUTH_ROUTES.brandDashboard,
  );
  if (resolved !== candidate) throw new UnsafeBrandDestinationError();
  return resolved;
}
