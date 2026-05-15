import { Route, Routes } from "react-router-dom";

import { BrandOnboardingShell } from "../layouts/brand-onboarding-shell/BrandOnboardingShell";
import { BrandOnboardingCataloguePage } from "../pages/brand/onboarding/brand-onboarding-catalogue-page";
import { BrandOnboardingCompetitorsPage } from "../pages/brand/onboarding/brand-onboarding-competitors-page";
import { BrandOnboardingDnaPage } from "../pages/brand/onboarding/brand-onboarding-dna-page";
import { BrandOnboardingLandingPage } from "../pages/brand/onboarding/brand-onboarding-landing-page";
import { BrandOnboardingScanPage } from "../pages/brand/onboarding/brand-onboarding-scan-page";
import { BrandOnboardingVerificationPage } from "../pages/brand/onboarding/brand-onboarding-verification-page";

export function BrandOnboardingAppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<BrandOnboardingShell />}>
        <Route index element={<BrandOnboardingLandingPage />} />
        <Route
          path="brand/onboarding/scan"
          element={<BrandOnboardingScanPage />}
        />
        <Route path="brand/onboarding/dna" element={<BrandOnboardingDnaPage />} />
        <Route
          path="brand/onboarding/catalogue"
          element={<BrandOnboardingCataloguePage />}
        />
        <Route
          path="brand/onboarding/competitors"
          element={<BrandOnboardingCompetitorsPage />}
        />
        <Route
          path="brand/onboarding/verification"
          element={<BrandOnboardingVerificationPage />}
        />
      </Route>
    </Routes>
  );
}
