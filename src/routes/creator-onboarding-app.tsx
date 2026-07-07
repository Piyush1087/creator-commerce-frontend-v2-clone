import { Route, Routes } from "react-router-dom";

import { CreatorOnboardingShell } from "../layouts/creator-onboarding-shell/CreatorOnboardingShell";
import { CreatorOnboardingConnectPage } from "../pages/creator/onboarding/creator-onboarding-connect-page";
import { CreatorOnboardingLandingPage } from "../pages/creator/onboarding/creator-onboarding-landing-page";
import { CreatorOnboardingModulesPage } from "../pages/creator/onboarding/creator-onboarding-modules-page";
import { CreatorOnboardingSignupPage } from "../pages/creator/onboarding/creator-onboarding-signup-page";
import { CreatorOnboardingSyncPage } from "../pages/creator/onboarding/creator-onboarding-sync-page";

export function CreatorOnboardingAppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<CreatorOnboardingShell />}>
        <Route index element={<CreatorOnboardingLandingPage />} />
        <Route path="modules" element={<CreatorOnboardingModulesPage />} />
        <Route path="signup" element={<CreatorOnboardingSignupPage />} />
        <Route path="connect" element={<CreatorOnboardingConnectPage />} />
        <Route path="sync" element={<CreatorOnboardingSyncPage />} />
      </Route>
    </Routes>
  );
}
