import { Alert } from "../../../design-system/aurora";
import { PublicBrandLandingWorkspace } from "../../../features/public-brand/components/PublicBrandLandingWorkspace";
import { useBrandCollaborationPage } from "../../../features/public-brand/hooks/use-brand-collaboration-page";
import "../../../features/public-brand/public-brand.css";

export function BrandCollaborationPage() {
  const { landing, loading, error } = useBrandCollaborationPage();

  if (!loading && error && !landing) {
    return (
      <div className="cc-workspace">
        <Alert tone="error" title="Could not load creator page">
          {error}
        </Alert>
      </div>
    );
  }

  return (
    <PublicBrandLandingWorkspace
      landing={landing}
      loading={loading}
      error={error}
      layout="brand-preview"
    />
  );
}
