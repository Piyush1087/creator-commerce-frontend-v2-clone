import { BrowserRouter } from "react-router-dom";

import { AppRoutes } from "../routes/app-routes";
import { ToastProvider } from "../design-system/aurora";

export function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ToastProvider>
  );
}
