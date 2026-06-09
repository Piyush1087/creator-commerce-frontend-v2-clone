import { Navigate, Route, Routes } from "react-router-dom";

import { AUTH_ROUTES } from "../features/auth/constants";
import { LoginPage } from "../pages/auth/login-page";
import { BrandDashboardPage } from "../pages/brand/dashboard/brand-dashboard-page";
import { BrandCentrePage } from "../pages/brand/brand-centre/brand-centre-page";
import { BrandCollaborationsPage } from "../pages/brand/collaborations/brand-collaborations-page";
import { BrandSettingsLayout } from "../pages/brand/settings/brand-settings-layout";
import { BrandSettingsBillingPage } from "../pages/brand/settings/brand-settings-billing-page";
import { BrandSettingsEscrowPage } from "../pages/brand/settings/brand-settings-escrow-page";
import { BrandUceCampaignsPage } from "../pages/brand/uce/BrandUceCampaignsPage";
import { BrandUceCampaignCreatePage } from "../pages/brand/uce/BrandUceCampaignCreatePage";
import { BrandUceCampaignDetailPage } from "../pages/brand/uce/BrandUceCampaignDetailPage";
import { CreatorDashboardPage } from "../pages/creator/dashboard/creator-dashboard-page";
import { CreatorCollaborationsPage } from "../pages/creator/collaborations/creator-collaborations-page";
import { AppShellLayout } from "../layouts/app-shell/AppShellLayout";
import { RequireAuth } from "../shared/auth/require-auth";
import { BrandOnboardingAppRoutes } from "./brand-onboarding-app";

export function AppRoutes() {
  return (
    <Routes>
      <Route path={AUTH_ROUTES.login} element={<LoginPage />} />
      <Route
        element={
          <RequireAuth>
            <AppShellLayout />
          </RequireAuth>
        }
      >
        <Route path={AUTH_ROUTES.brandDashboard} element={<BrandDashboardPage />} />
        <Route path={AUTH_ROUTES.brandCentre} element={<BrandCentrePage />} />
        <Route path={AUTH_ROUTES.brandUceCampaigns} element={<BrandUceCampaignsPage />} />
        <Route path={AUTH_ROUTES.brandUceCampaignCreate} element={<BrandUceCampaignCreatePage />} />
        <Route path={AUTH_ROUTES.brandUceCampaignDetail} element={<BrandUceCampaignDetailPage />} />
        <Route path={AUTH_ROUTES.brandCollaborations} element={<BrandCollaborationsPage />} />
        <Route path={AUTH_ROUTES.brandSettings} element={<BrandSettingsLayout />}>
          <Route index element={<Navigate to="billing" replace />} />
          <Route path="billing" element={<BrandSettingsBillingPage />} />
          <Route path="escrow" element={<BrandSettingsEscrowPage />} />
        </Route>
        <Route path={AUTH_ROUTES.creatorDashboard} element={<CreatorDashboardPage />} />
        <Route path={AUTH_ROUTES.creatorCollaborations} element={<CreatorCollaborationsPage />} />
      </Route>
      <Route path="/*" element={<BrandOnboardingAppRoutes />} />
    </Routes>
  );
}
