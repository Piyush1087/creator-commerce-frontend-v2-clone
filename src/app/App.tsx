import { BrowserRouter } from "react-router-dom";

import { AppRoutes } from "../routes/app-routes";
import { ToastProvider } from "../design-system/aurora";
import { AuthSessionBootstrap } from "../shared/auth/auth-session-bootstrap";

export function App() {
  return (
    <ToastProvider>
      <AuthSessionBootstrap>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthSessionBootstrap>
    </ToastProvider>
  );
}
