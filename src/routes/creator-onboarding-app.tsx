import { Navigate, Route, Routes } from "react-router-dom";

import { CreatorOnboardingShell } from "../layouts/creator-onboarding-shell/CreatorOnboardingShell";
import { CreatorOnboardingLandingPage } from "../pages/creator/onboarding/creator-onboarding-landing-page";

export function CreatorOnboardingAppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<CreatorOnboardingShell />}>
        <Route index element={<CreatorOnboardingLandingPage />} />
        <Route
          path="modules"
          element={<Navigate to="/creator/onboarding" replace />}
        />
        <Route
          path="signup"
          element={<Navigate to="/creator/onboarding" replace />}
        />
        <Route
          path="connect"
          element={<Navigate to="/creator/onboarding" replace />}
        />
        <Route
          path="sync"
          element={<Navigate to="/creator/onboarding" replace />}
        />
      </Route>
    </Routes>
  );
}
