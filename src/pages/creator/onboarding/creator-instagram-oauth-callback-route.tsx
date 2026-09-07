import { CreatorInstagramSettingsOAuthCallback } from "../../../features/settings/components/creator/creator-instagram-settings-oauth-callback";
import { readCreatorInstagramSettingsFlow } from "../../../features/settings/utils/creator-instagram-settings-oauth-session";
import { CreatorInstagramOAuthCallbackPage } from "./creator-instagram-oauth-callback-page";

/**
 * The provider callback URL stays stable. A short-lived, tab-scoped marker
 * selects Settings recovery; without it C-01 Creator Entry remains authority.
 */
export function CreatorInstagramOAuthCallbackRoute() {
  return readCreatorInstagramSettingsFlow() ? (
    <CreatorInstagramSettingsOAuthCallback />
  ) : (
    <CreatorInstagramOAuthCallbackPage />
  );
}
