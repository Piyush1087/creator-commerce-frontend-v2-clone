import React from "react";
import ReactDOM from "react-dom/client";

import { App } from "./app/App";
import "./design-system/aurora/tokens.css";
import "./design-system/aurora/components.css";
import "./layouts/brand-onboarding-shell/brand-onboarding-shell.css";
import "./features/brand-onboarding/brand-onboarding.css";
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
