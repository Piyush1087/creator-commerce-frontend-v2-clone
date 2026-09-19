import {
  BrandCentreWorkspaceNav,
  type BrandCentreWorkspace,
} from "../BrandCentreWorkspaceNav";

export function OfferingNavigation({
  current = "Offerings",
}: {
  current?: Extract<BrandCentreWorkspace, "Brand" | "Offerings">;
}) {
  return <BrandCentreWorkspaceNav current={current} />;
}
