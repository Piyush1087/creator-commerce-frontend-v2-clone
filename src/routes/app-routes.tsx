import { Navigate, Route, Routes } from "react-router-dom";

import { AUTH_ROUTES, PUBLIC_ROUTES } from "../features/auth/constants";
import { LoginPage } from "../pages/auth/login-page";
import { ForgotPasswordPage } from "../pages/auth/forgot-password-page";
import { ResetPasswordPage } from "../pages/auth/reset-password-page";
import { TeamInvitationPage } from "../pages/public/brand/team-invitation-page";
import { BrandDashboardPage } from "../pages/brand/dashboard/brand-dashboard-page";
import { BrandCentrePage } from "../pages/brand/brand-centre/brand-centre-page";
import { BrandCollaborationsPage } from "../pages/brand/collaborations/brand-collaborations-page";
import { BrandSettingsIntegrationsPage } from "../pages/brand/settings/brand-settings-integrations-page";
import { BrandSettingsGeneralPage } from "../pages/brand/settings/brand-settings-general-page";
import { BrandSettingsLayout } from "../pages/brand/settings/brand-settings-layout";
import { BrandSettingsBillingPage } from "../pages/brand/settings/brand-settings-billing-page";
import { BrandSettingsEscrowPage } from "../pages/brand/settings/brand-settings-escrow-page";
import { CreatorSettingsLayout } from "../pages/creator/settings/creator-settings-layout";
import { CreatorSettingsPayoutsPage } from "../pages/creator/settings/creator-settings-payouts-page";
import { CreatorSettingsProfilePage } from "../pages/creator/settings/creator-settings-profile-page";
import { CreatorSettingsSocialPage } from "../pages/creator/settings/creator-settings-social-page";
import { BrandUceCampaignsPage } from "../pages/brand/uce/BrandUceCampaignsPage";
import { BrandUceCampaignCreatePage } from "../pages/brand/uce/BrandUceCampaignCreatePage";
import { BrandUceCampaignDetailPage } from "../pages/brand/uce/BrandUceCampaignDetailPage";
import { BrandCollaborationPage } from "../pages/brand/collaboration/brand-collaboration-page";
import { BrandPayoutsPage } from "../pages/brand/payouts/brand-payouts-page";
import { CreatorCampaignsCommandCenterPage } from "../pages/creator/campaigns/creator-campaigns-command-center-page";
import { CreatorCampaignsHistoryPage } from "../pages/creator/campaigns/creator-campaigns-history-page";
import { CreatorCampaignDetailPage } from "../pages/creator/marketplace/creator-campaign-detail-page";
import { CreatorMarketplacePage } from "../pages/creator/marketplace/creator-marketplace-page";
import { CreatorCentrePage } from "../pages/creator/centre/creator-centre-page";
import { CreatorAnalyticsPage } from "../pages/creator/centre/creator-analytics-page";
import { CreatorMediaKitPage } from "../pages/creator/centre/creator-media-kit-page";
import { CreatorCollaborationsPage } from "../pages/creator/collaborations/creator-collaborations-page";
import { CreatorPayoutsPage } from "../pages/creator/payouts/creator-payouts-page";
import { PublicBrandLandingPage } from "../pages/public/brand/public-brand-landing-page";
import { PublicCampaignDetailPage } from "../pages/public/marketplace/public-campaign-detail-page";
import { PublicInviteLandingPage } from "../pages/public/marketplace/public-invite-landing-page";
import { PublicMarketplacePage } from "../pages/public/marketplace/public-marketplace-page";
import { AppShellLayout } from "../layouts/app-shell/AppShellLayout";
import { MarketplaceGuestLayout } from "../layouts/marketplace-guest/MarketplaceGuestLayout";
import { RequireAuth } from "../shared/auth/require-auth";
import { CreatorOnboardingAppRoutes } from "./creator-onboarding-app";
import { BrandOnboardingAppRoutes } from "./brand-onboarding-app";
import { CreatorInstagramOAuthCallbackPage } from "../pages/creator/onboarding/creator-instagram-oauth-callback-page";
import { CREATOR_ONBOARDING_ROUTES } from "../features/creator-onboarding/constants";
import { CollaborationRouteGuard } from "../features/collaboration/components/CollaborationRouteGuard";
import { UnmatchedRouteHandler } from "./unmatched-route-handler";

export function AppRoutes() {
  return (
    <Routes>
      <Route path={AUTH_ROUTES.login} element={<LoginPage />} />
      <Route
        path={AUTH_ROUTES.forgotPassword}
        element={<ForgotPasswordPage />}
      />
      <Route path={AUTH_ROUTES.resetPassword} element={<ResetPasswordPage />} />
      <Route
        path="/brand/team-invitations/accept"
        element={<TeamInvitationPage />}
      />
      <Route element={<MarketplaceGuestLayout />}>
        <Route
          path={PUBLIC_ROUTES.brandLanding}
          element={<PublicBrandLandingPage />}
        />
        <Route
          path={PUBLIC_ROUTES.marketplace}
          element={<PublicMarketplacePage />}
        />
        <Route
          path={PUBLIC_ROUTES.marketplaceInvite}
          element={<PublicInviteLandingPage />}
        />
        <Route
          path={PUBLIC_ROUTES.marketplaceCampaign}
          element={<PublicCampaignDetailPage />}
        />
      </Route>
      <Route
        element={
          <RequireAuth>
            <AppShellLayout />
          </RequireAuth>
        }
      >
        <Route
          path={AUTH_ROUTES.brandDashboard}
          element={<BrandDashboardPage />}
        />
        <Route path={AUTH_ROUTES.brandCentre} element={<BrandCentrePage />} />
        <Route
          path={AUTH_ROUTES.brandUceCampaigns}
          element={<BrandUceCampaignsPage />}
        />
        <Route
          path={AUTH_ROUTES.brandUceCampaignCreate}
          element={<BrandUceCampaignCreatePage />}
        />
        <Route
          path={AUTH_ROUTES.brandUceCampaignDetail}
          element={<BrandUceCampaignDetailPage />}
        />
        <Route
          path={AUTH_ROUTES.brandCollaborationPage}
          element={<BrandCollaborationPage />}
        />
        <Route
          path={AUTH_ROUTES.brandCollaborations}
          element={
            <CollaborationRouteGuard expectedRole="BRAND">
              <BrandCollaborationsPage />
            </CollaborationRouteGuard>
          }
        />
        <Route path={AUTH_ROUTES.brandPayouts} element={<BrandPayoutsPage />} />
        <Route
          path={AUTH_ROUTES.brandSettings}
          element={<BrandSettingsLayout />}
        >
          <Route index element={<Navigate to="general" replace />} />
          <Route path="general" element={<BrandSettingsGeneralPage />} />
          <Route
            path="integrations"
            element={<BrandSettingsIntegrationsPage />}
          />
          <Route path="billing" element={<BrandSettingsBillingPage />} />
          <Route path="escrow" element={<BrandSettingsEscrowPage />} />
        </Route>
        <Route path={AUTH_ROUTES.creatorHome} element={<CreatorCentrePage />} />
        <Route
          path={AUTH_ROUTES.creatorAnalytics}
          element={<CreatorAnalyticsPage />}
        />
        <Route
          path={AUTH_ROUTES.creatorMediaKit}
          element={<CreatorMediaKitPage />}
        />
        <Route
          path={AUTH_ROUTES.creatorDashboard}
          element={<Navigate to={AUTH_ROUTES.creatorHome} replace />}
        />
        <Route
          path={AUTH_ROUTES.creatorMarketplace}
          element={<CreatorMarketplacePage />}
        />
        <Route
          path={AUTH_ROUTES.creatorMarketplaceCampaign}
          element={<CreatorCampaignDetailPage />}
        />
        <Route
          path={AUTH_ROUTES.creatorCampaigns}
          element={<CreatorCampaignsCommandCenterPage />}
        />
        <Route
          path={AUTH_ROUTES.creatorPayouts}
          element={<CreatorPayoutsPage />}
        />
        <Route
          path={AUTH_ROUTES.creatorCampaignsHistory}
          element={<CreatorCampaignsHistoryPage />}
        />
        <Route
          path={AUTH_ROUTES.creatorCollaborations}
          element={
            <CollaborationRouteGuard expectedRole="CREATOR">
              <CreatorCollaborationsPage />
            </CollaborationRouteGuard>
          }
        />
        <Route
          path={AUTH_ROUTES.creatorSettings}
          element={<CreatorSettingsLayout />}
        >
          <Route index element={<Navigate to="profile" replace />} />
          <Route path="profile" element={<CreatorSettingsProfilePage />} />
          <Route path="social" element={<CreatorSettingsSocialPage />} />
          <Route path="payouts" element={<CreatorSettingsPayoutsPage />} />
        </Route>
      </Route>
      <Route
        path="/creator/onboarding/*"
        element={<CreatorOnboardingAppRoutes />}
      />
      <Route
        path={CREATOR_ONBOARDING_ROUTES.instagramCallback}
        element={<CreatorInstagramOAuthCallbackPage />}
      />
      <Route
        path="/*"
        element={
          <>
            <UnmatchedRouteHandler />
            <BrandOnboardingAppRoutes />
          </>
        }
      />
    </Routes>
  );
}
