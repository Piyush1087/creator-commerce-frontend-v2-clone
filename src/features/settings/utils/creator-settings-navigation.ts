import { Instagram, ShieldCheck, UserRound, Users, Wallet } from "lucide-react";
import type { ElementType } from "react";

import type { CreatorWorkspaceAction } from "../../../shared/creator/creator-workspace-actor.contract";
import {
  projectCreatorShellItems,
  type CreatorShellState,
} from "../../../layouts/app-shell/creator-shell-capabilities";
import { CREATOR_SETTINGS_ROUTES } from "../constants/settings-routes";

export type CreatorSettingsNavigationItem = {
  id: "account" | "profile" | "team" | "instagram" | "payouts";
  label: string;
  icon: ElementType;
  to: string;
  availability?: "AVAILABLE" | "UNAVAILABLE";
  unavailableReason?: string;
  alwaysAvailableInRecovery?: boolean;
  requiresCreatorWorkspace?: boolean;
  requiredCreatorAction?: CreatorWorkspaceAction;
};

export const CREATOR_SETTINGS_NAVIGATION: readonly CreatorSettingsNavigationItem[] =
  [
    {
      id: "account",
      label: "Account & Security",
      icon: ShieldCheck,
      to: CREATOR_SETTINGS_ROUTES.account,
      alwaysAvailableInRecovery: true,
    },
    {
      id: "profile",
      label: "Profile & Contact",
      icon: UserRound,
      to: CREATOR_SETTINGS_ROUTES.profile,
      requiresCreatorWorkspace: true,
      requiredCreatorAction: "WORKSPACE_PROFILE_READ",
    },
    {
      id: "team",
      label: "Team",
      icon: Users,
      to: CREATOR_SETTINGS_ROUTES.team,
      requiresCreatorWorkspace: true,
      requiredCreatorAction: "TEAM_READ",
    },
    {
      id: "instagram",
      label: "Instagram",
      icon: Instagram,
      to: CREATOR_SETTINGS_ROUTES.instagram,
      requiresCreatorWorkspace: true,
      requiredCreatorAction: "INSTAGRAM_SETTINGS_READ",
    },
    {
      id: "payouts",
      label: "Payouts & Legal",
      icon: Wallet,
      to: CREATOR_SETTINGS_ROUTES.payouts,
      requiresCreatorWorkspace: true,
      requiredCreatorAction: "PAYOUT_SETTINGS_READ",
    },
  ] as const;

export function getCreatorSettingsNavigation(
  state: CreatorShellState,
): CreatorSettingsNavigationItem[] {
  return projectCreatorShellItems(CREATOR_SETTINGS_NAVIGATION, state);
}
