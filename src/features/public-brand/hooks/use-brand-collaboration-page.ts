import { useCallback, useEffect, useState } from "react";

import { fetchBrandCollaborationPageMeta } from "../../brand-centre/api/brand-centre-client";
import { fetchPublicBrandLanding } from "../api/public-brand-client";
import type { PublicBrandLandingResponse } from "../contracts/public-brand.contracts";

export function useBrandCollaborationPage() {
  const [landing, setLanding] = useState<PublicBrandLandingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const meta = await fetchBrandCollaborationPageMeta();
      const response = await fetchPublicBrandLanding(meta.slug);
      setLanding(response);
    } catch (err) {
      setLanding(null);
      setError(err instanceof Error ? err.message : "Failed to load creator page.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { landing, loading, error, reload: load };
}
