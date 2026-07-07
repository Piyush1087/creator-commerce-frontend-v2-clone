import type { ActivatedModule } from "../contracts/creator-onboarding.contracts";

const UI_TO_API: Record<string, ActivatedModule> = {
  brand_deals: "MESSY_DMS_TO_DEALS",
  media_kit: "BUILDING_UPDATING_MEDIA_KIT",
  performance: "POST_PERFORMANCE_PRICING",
  payments: "CONTRACT_ESCROW_SECURITY",
};

export function mapUiModulesToApi(uiModuleIds: string[]): ActivatedModule[] {
  return uiModuleIds
    .map((id) => UI_TO_API[id])
    .filter((value): value is ActivatedModule => Boolean(value));
}
