import { Route, Routes } from "react-router-dom";

import { BrandOnboardingShell } from "../layouts/brand-onboarding-shell/BrandOnboardingShell";
import { BrandOnboardingCataloguePage } from "../pages/brand/onboarding/brand-onboarding-catalogue-page";
import { BrandOnboardingCompetitorsPage } from "../pages/brand/onboarding/brand-onboarding-competitors-page";
import { BrandOnboardingCoreIdentityPage } from "../pages/brand/onboarding/brand-onboarding-core-identity-page";
import { BrandOnboardingDnaPage } from "../pages/brand/onboarding/brand-onboarding-dna-page";
import { BrandOnboardingIntelligenceScanPage } from "../pages/brand/onboarding/brand-onboarding-intelligence-scan-page";
import { BrandOnboardingLandingPage } from "../pages/brand/onboarding/brand-onboarding-landing-page";
import { BrandOnboardingPricingPage } from "../pages/brand/onboarding/brand-onboarding-pricing-page";
import { BrandOnboardingScanPage } from "../pages/brand/onboarding/brand-onboarding-scan-page";
import { BrandOnboardingSocialSyncPage } from "../pages/brand/onboarding/brand-onboarding-social-sync-page";
import { BrandOnboardingSyncCompletePage } from "../pages/brand/onboarding/brand-onboarding-sync-complete-page";
import { BrandOnboardingSyncVerifyPage } from "../pages/brand/onboarding/brand-onboarding-sync-verify-page";
import { BrandOnboardingVerificationPage } from "../pages/brand/onboarding/brand-onboarding-verification-page";
import { BrandIntelligenceIdentityTestPage } from "../pages/brand/intelligence/brand-intelligence-identity-test-page";

export function BrandOnboardingAppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<BrandOnboardingShell />}>
        <Route index element={<BrandOnboardingLandingPage />} />
        <Route
          path="brand/intelligence/identity-test"
          element={<BrandIntelligenceIdentityTestPage />}
        />
        <Route
          path="brand/onboarding/scan"
          element={<BrandOnboardingScanPage />}
        />
        <Route
          path="brand/onboarding/core-identity"
          element={<BrandOnboardingCoreIdentityPage />}
        />
        <Route
          path="brand/onboarding/intelligence-scan"
          element={<BrandOnboardingIntelligenceScanPage />}
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
        <Route
          path="brand/onboarding/pricing"
          element={<BrandOnboardingPricingPage />}
        />
        <Route
          path="brand/onboarding/social-sync"
          element={<BrandOnboardingSocialSyncPage />}
        />
        <Route
          path="brand/onboarding/sync-verify"
          element={<BrandOnboardingSyncVerifyPage />}
        />
        <Route
          path="brand/onboarding/sync-complete"
          element={<BrandOnboardingSyncCompletePage />}
        />
      </Route>
    </Routes>
  );
}
