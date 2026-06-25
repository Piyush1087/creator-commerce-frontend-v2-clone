import { useCallback, useEffect, useState } from "react";

import { fetchPublicBrandLanding } from "../api/public-brand-client";
import type { PublicBrandLandingResponse } from "../contracts/public-brand.contracts";
import { rememberBrandSlug } from "../utils/brand-page-session";

export function usePublicBrandLanding(slug: string | undefined) {
  const [landing, setLanding] = useState<PublicBrandLandingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!slug) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetchPublicBrandLanding(slug);
      setLanding(response);
      rememberBrandSlug(response.slug);
    } catch (err) {
      setLanding(null);
      setError(err instanceof Error ? err.message : "Failed to load brand page.");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

  return { landing, loading, error, reload: load };
}
