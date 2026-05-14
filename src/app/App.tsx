import { BrowserRouter } from "react-router-dom";

import { BrandOnboardingAppRoutes } from "../routes/brand-onboarding-app";

export function App() {
  return (
    <BrowserRouter>
      <BrandOnboardingAppRoutes />
    </BrowserRouter>
  );
}
