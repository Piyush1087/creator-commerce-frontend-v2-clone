import { Route, Routes } from "react-router-dom";

import { AUTH_ROUTES } from "../features/auth/constants";
import { BrandLoginPage } from "../pages/auth/brand-login-page";
import { BrandDashboardPage } from "../pages/brand/dashboard/brand-dashboard-page";
import { RequireAuth } from "../shared/auth/require-auth";
import { BrandOnboardingAppRoutes } from "./brand-onboarding-app";

export function AppRoutes() {
  return (
    <Routes>
      <Route path={AUTH_ROUTES.login} element={<BrandLoginPage />} />
      <Route
        path={AUTH_ROUTES.brandDashboard}
        element={
          <RequireAuth>
            <BrandDashboardPage />
          </RequireAuth>
        }
      />
      <Route path="/*" element={<BrandOnboardingAppRoutes />} />
    </Routes>
  );
}
