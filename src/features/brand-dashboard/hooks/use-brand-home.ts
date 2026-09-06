import { useCallback, useEffect, useState } from "react";

import { getBrandHome } from "../api/brand-home-client";
import type { BrandHomeResponse } from "../contracts/brand-home.schemas";

const HOME_UNAVAILABLE_MESSAGE = "Brand Home is temporarily unavailable.";

export function useBrandHome() {
  const [data, setData] = useState<BrandHomeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestSequence, setRequestSequence] = useState(0);

  useEffect(() => {
    let active = true;
    setData(null);
    setError(null);
    setIsLoading(true);

    void getBrandHome()
      .then((response) => {
        if (active) setData(response);
      })
      .catch(() => {
        if (active) setError(HOME_UNAVAILABLE_MESSAGE);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [requestSequence]);

  const refresh = useCallback(() => {
    setRequestSequence((current) => current + 1);
  }, []);

  return { data, isLoading, error, refresh };
}
