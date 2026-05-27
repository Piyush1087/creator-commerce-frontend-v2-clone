import { Route, Routes } from "react-router-dom";

import { AUTH_ROUTES } from "../features/auth/constants";
import { BrandLoginPage } from "../pages/auth/brand-login-page";
import { BrandDashboardPage } from "../pages/brand/dashboard/brand-dashboard-page";
import { BrandCentrePage } from "../pages/brand/brand-centre/brand-centre-page";
import { BrandCentreBudgetPage } from "../pages/brand/brand-centre/brand-centre-budget-page";
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
      <Route path="/visual-test" element={<BrandDashboardPage />} />
      <Route path="/brand-centre" element={<BrandCentrePage />} />
      <Route path="/brand-centre-budget" element={<BrandCentreBudgetPage />} />
      <Route path="/*" element={<BrandOnboardingAppRoutes />} />
    </Routes>
  );
}
