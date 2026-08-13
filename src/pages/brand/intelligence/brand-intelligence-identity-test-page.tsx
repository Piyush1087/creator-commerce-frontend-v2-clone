import { useNavigate } from "react-router-dom";

import { IdentityTestResultsView } from "../../../features/brand-intelligence/components/identity-test-results-view";
import { loadIdentityTestResult } from "../../../features/brand-intelligence/session/identity-test-session";

export function BrandIntelligenceIdentityTestPage() {
  const navigate = useNavigate();
  const result = loadIdentityTestResult();

  return (
    <main className="bob-container" style={{ maxWidth: 960 }}>
      <IdentityTestResultsView
        result={result}
        onBack={() => navigate("/")}
      />
    </main>
  );
}
