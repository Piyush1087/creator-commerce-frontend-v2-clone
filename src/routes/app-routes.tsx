import { Route, Routes } from "react-router-dom";

import { AUTH_ROUTES } from "../features/auth/constants";
import { BrandLoginPage } from "../pages/auth/brand-login-page";
import { BrandDashboardPage } from "../pages/brand/dashboard/brand-dashboard-page";
import { BrandCentrePage } from "../pages/brand/brand-centre/brand-centre-page";
import { AppShellLayout } from "../layouts/app-shell/AppShellLayout";
import { RequireAuth } from "../shared/auth/require-auth";
import { BrandOnboardingAppRoutes } from "./brand-onboarding-app";

export function AppRoutes() {
  return (
    <Routes>
      <Route path={AUTH_ROUTES.login} element={<BrandLoginPage />} />
      <Route
        element={
          <RequireAuth>
            <AppShellLayout />
          </RequireAuth>
        }
      >
        <Route path={AUTH_ROUTES.brandDashboard} element={<BrandDashboardPage />} />
        <Route path={AUTH_ROUTES.brandCentre} element={<BrandCentrePage />} />
      </Route>
      <Route path="/*" element={<BrandOnboardingAppRoutes />} />
    </Routes>
  );
}
