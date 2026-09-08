import {
  CampaignAuthority,
  CampaignOpportunityAuthority,
} from "../features/creator-campaigns/components/CampaignAuthority";
import {
  CampaignUnavailable,
  LegacyCampaignRedirect,
} from "../features/creator-campaigns/components/CampaignCompatibility";
import { CampaignsLayout } from "../pages/creator/campaigns/campaigns-layout";
import {
  OpportunitiesPage,
  OpportunityPage,
  ApplicationsPage,
  ApplicationPage,
  PublicCampaignPage,
} from "../pages/creator/campaigns/c03-pages";
import { Navigate, Route, Routes } from "react-router-dom";

import { AUTH_ROUTES, PUBLIC_ROUTES } from "../features/auth/constants";
import { LoginPage } from "../pages/auth/login-page";
import { ForgotPasswordPage } from "../pages/auth/forgot-password-page";
import { ResetPasswordPage } from "../pages/auth/reset-password-page";
import { TeamInvitationPage } from "../pages/public/brand/team-invitation-page";
import { BrandDashboardPage } from "../pages/brand/dashboard/brand-dashboard-page";
import { BrandCentrePage } from "../pages/brand/brand-centre/brand-centre-page";
import { BrandCentreOfferingsPage } from "../pages/brand/brand-centre/brand-centre-offerings-page";
import { BrandCentreOfferingDetailPage } from "../pages/brand/brand-centre/brand-centre-offering-detail-page";
import { BrandCollaborationsPage } from "../pages/brand/collaborations/brand-collaborations-page";
import { BrandSettingsIntegrationsPage } from "../pages/brand/settings/brand-settings-integrations-page";
import { BrandSettingsGeneralPage } from "../pages/brand/settings/brand-settings-general-page";
import { BrandSettingsLayout } from "../pages/brand/settings/brand-settings-layout";
import { BrandSettingsBillingPage } from "../pages/brand/settings/brand-settings-billing-page";
import { BrandSettingsEscrowPage } from "../pages/brand/settings/brand-settings-escrow-page";
import { CreatorSettingsLayout } from "../pages/creator/settings/creator-settings-layout";
import { CreatorSettingsAccountPage } from "../pages/creator/settings/creator-settings-account-page";
import { CreatorSettingsPayoutsPage } from "../pages/creator/settings/creator-settings-payouts-page";
import { CreatorSettingsProfilePage } from "../pages/creator/settings/creator-settings-profile-page";
import { CreatorSettingsTeamPage } from "../pages/creator/settings/creator-settings-team-page";
import { CreatorSettingsInstagramPage } from "../pages/creator/settings/creator-settings-instagram-page";
import { BrandUceCampaignsPage } from "../pages/brand/uce/BrandUceCampaignsPage";
import { BrandUceCampaignCreatePage } from "../pages/brand/uce/BrandUceCampaignCreatePage";
import { BrandUceCampaignDetailPage } from "../pages/brand/uce/BrandUceCampaignDetailPage";
import { BrandCollaborationPage } from "../pages/brand/collaboration/brand-collaboration-page";
import { BrandPayoutsPage } from "../pages/brand/payouts/brand-payouts-page";
import { CreatorCentrePage } from "../pages/creator/centre/creator-centre-page";
import { CreatorHomePage } from "../pages/creator/centre/creator-home-page";
import { CreatorAnalyticsPage } from "../pages/creator/centre/creator-analytics-page";
import { CreatorMediaKitPage } from "../pages/creator/centre/creator-media-kit-page";
import { CreatorCollaborationsPage } from "../pages/creator/collaborations/creator-collaborations-page";
import { CreatorPayoutsPage } from "../pages/creator/payouts/creator-payouts-page";
import { PublicBrandLandingPage } from "../pages/public/brand/public-brand-landing-page";
import { AppShellLayout } from "../layouts/app-shell/AppShellLayout";
import { MarketplaceGuestLayout } from "../layouts/marketplace-guest/MarketplaceGuestLayout";
import { RequireAuth } from "../shared/auth/require-auth";
import { CreatorOnboardingAppRoutes } from "./creator-onboarding-app";
import { BrandOnboardingAppRoutes } from "./brand-onboarding-app";
import { CREATOR_ONBOARDING_ROUTES } from "../features/creator-onboarding/constants";
import { CollaborationRouteGuard } from "../features/collaboration/components/CollaborationRouteGuard";
import { UnmatchedRouteHandler } from "./unmatched-route-handler";
import { RequireCreatorPlatformAccess } from "../features/creator-onboarding/components/creator-platform-route-guard";
import { CreatorSettingsActionGuard } from "../features/settings/components/creator-settings-action-guard";
import { CreatorTeamInvitationAcceptance } from "../features/settings/components/creator/creator-team-invitation-acceptance";
import { CreatorInstagramOAuthCallbackRoute } from "../pages/creator/onboarding/creator-instagram-oauth-callback-route";
import { BrandPayoutsRouteGuard } from "../features/brand-payouts/components/BrandPayoutsRouteGuard";

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
      <Route
        path={AUTH_ROUTES.creatorTeamInvitationAccept}
        element={<CreatorTeamInvitationAcceptance />}
      />
      <Route path={PUBLIC_ROUTES.campaign} element={<PublicCampaignPage />} />
      <Route
        path={PUBLIC_ROUTES.marketplace}
        element={<CampaignUnavailable />}
      />
      <Route
        path={PUBLIC_ROUTES.marketplaceInvite}
        element={<CampaignUnavailable invitation />}
      />
      <Route
        path={PUBLIC_ROUTES.marketplaceCampaign}
        element={<LegacyCampaignRedirect />}
      />
      <Route
        path={AUTH_ROUTES.creatorMarketplace}
        element={<Navigate to={AUTH_ROUTES.creatorOpportunities} replace />}
      />
      <Route
        path={AUTH_ROUTES.creatorMarketplaceCampaign}
        element={<LegacyCampaignRedirect creator />}
      />
      <Route element={<MarketplaceGuestLayout />}>
        <Route
          path={PUBLIC_ROUTES.brandLanding}
          element={<PublicBrandLandingPage />}
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
          path={AUTH_ROUTES.brandCentreOfferings}
          element={<BrandCentreOfferingsPage />}
        />
        <Route
          path={AUTH_ROUTES.brandCentreOfferingDetail}
          element={<BrandCentreOfferingDetailPage />}
        />
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
        <Route
          path={AUTH_ROUTES.brandPayouts}
          element={
            <BrandPayoutsRouteGuard>
              <BrandPayoutsPage />
            </BrandPayoutsRouteGuard>
          }
        />
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
        <Route
          path={AUTH_ROUTES.creatorSettings}
          element={<CreatorSettingsLayout />}
        >
          <Route index element={<Navigate to="account" replace />} />
          <Route path="account" element={<CreatorSettingsAccountPage />} />
          <Route
            path="profile"
            element={
              <CreatorSettingsActionGuard requiredAction="WORKSPACE_PROFILE_READ">
                <CreatorSettingsProfilePage />
              </CreatorSettingsActionGuard>
            }
          />
          <Route
            path="team"
            element={
              <CreatorSettingsActionGuard requiredAction="TEAM_READ">
                <CreatorSettingsTeamPage />
              </CreatorSettingsActionGuard>
            }
          />
          <Route
            path="instagram"
            element={
              <CreatorSettingsActionGuard requiredAction="INSTAGRAM_SETTINGS_READ">
                <CreatorSettingsInstagramPage />
              </CreatorSettingsActionGuard>
            }
          />
          <Route
            path="social"
            element={
              <Navigate to={AUTH_ROUTES.creatorSettingsInstagram} replace />
            }
          />
          <Route
            path="payouts"
            element={
              <CreatorSettingsActionGuard requiredAction="PAYOUT_SETTINGS_READ">
                <CreatorSettingsPayoutsPage />
              </CreatorSettingsActionGuard>
            }
          />
        </Route>
        <Route element={<CampaignAuthority />}>
          <Route
            path={AUTH_ROUTES.creatorCollaborations}
            element={
              <CollaborationRouteGuard expectedRole="CREATOR">
                <CreatorCollaborationsPage />
              </CollaborationRouteGuard>
            }
          />
          <Route
            path={AUTH_ROUTES.creatorCampaigns}
            element={<CampaignsLayout />}
          >
            <Route index element={<Navigate to="opportunities" replace />} />
            <Route element={<CampaignOpportunityAuthority />}>
              <Route path="opportunities" element={<OpportunitiesPage />} />
              <Route
                path="opportunities/:campaignId"
                element={<OpportunityPage />}
              />
            </Route>
            <Route path="applications" element={<ApplicationsPage />} />
            <Route
              path="applications/:applicationId"
              element={<ApplicationPage />}
            />
            <Route
              path="history"
              element={
                <Navigate to={AUTH_ROUTES.creatorApplications} replace />
              }
            />
          </Route>
        </Route>
        <Route
          path={AUTH_ROUTES.creatorPayouts}
          element={<CreatorPayoutsPage />}
        />
        <Route element={<RequireCreatorPlatformAccess />}>
          <Route path={AUTH_ROUTES.creatorHome} element={<CreatorHomePage />} />
          {/* CREATOR_WORKSPACE_ENTRY technical mount. C-02 owns final Home/Center content. */}
          <Route
            path={AUTH_ROUTES.creatorCentre}
            element={<CreatorCentrePage />}
          />
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
          {/* COMPATIBILITY_RECONCILIATION_ONLY: dormant C-03 routes, not shell navigation authority. */}
        </Route>
      </Route>
      <Route
        path="/creator/onboarding/*"
        element={<CreatorOnboardingAppRoutes />}
      />
      <Route
        path={CREATOR_ONBOARDING_ROUTES.instagramCallback}
        element={<CreatorInstagramOAuthCallbackRoute />}
      />
      <Route
        path={CREATOR_ONBOARDING_ROUTES.legacyInstagramCallback}
        element={<CreatorInstagramOAuthCallbackRoute />}
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
