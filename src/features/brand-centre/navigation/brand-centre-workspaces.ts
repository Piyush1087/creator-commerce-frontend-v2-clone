import { AUTH_ROUTES } from "../../auth/constants";

export type BrandCentreWorkspaceId =
  | "overview"
  | "brand"
  | "offerings"
  | "instagram"
  | "market"
  | "recommendations";

export type BrandCentreWorkspaceDefinition = {
  id: BrandCentreWorkspaceId;
  label: string;
  route: string;
  availability: "AVAILABLE" | "CONTENT_PENDING";
  matches: (pathname: string) => boolean;
};

function isRouteOrDescendant(pathname: string, route: string): boolean {
  return pathname === route || pathname.startsWith(`${route}/`);
}

export const BRAND_CENTRE_WORKSPACES: readonly BrandCentreWorkspaceDefinition[] = [
  {
    id: "overview",
    label: "Overview",
    route: AUTH_ROUTES.brandCentreOverview,
    availability: "CONTENT_PENDING",
    matches: (pathname) =>
      isRouteOrDescendant(pathname, AUTH_ROUTES.brandCentreOverview),
  },
  {
    id: "brand",
    label: "Brand",
    route: AUTH_ROUTES.brandCentreBrand,
    availability: "AVAILABLE",
    matches: (pathname) => pathname === AUTH_ROUTES.brandCentreBrand,
  },
  {
    id: "offerings",
    label: "Offerings",
    route: AUTH_ROUTES.brandCentreOfferings,
    availability: "AVAILABLE",
    matches: (pathname) =>
      isRouteOrDescendant(pathname, AUTH_ROUTES.brandCentreOfferings),
  },
  {
    id: "instagram",
    label: "Instagram",
    route: AUTH_ROUTES.brandCentreInstagram,
    availability: "AVAILABLE",
    matches: (pathname) =>
      isRouteOrDescendant(pathname, AUTH_ROUTES.brandCentreInstagram),
  },
  {
    id: "market",
    label: "Market",
    route: AUTH_ROUTES.brandCentreMarket,
    availability: "CONTENT_PENDING",
    matches: (pathname) =>
      isRouteOrDescendant(pathname, AUTH_ROUTES.brandCentreMarket),
  },
  {
    id: "recommendations",
    label: "Recommendations",
    route: AUTH_ROUTES.brandCentreRecommendations,
    availability: "CONTENT_PENDING",
    matches: (pathname) =>
      isRouteOrDescendant(pathname, AUTH_ROUTES.brandCentreRecommendations),
  },
] as const;

export function resolveBrandCentreWorkspace(
  pathname: string,
): BrandCentreWorkspaceDefinition | undefined {
  return BRAND_CENTRE_WORKSPACES.find((workspace) => workspace.matches(pathname));
}
