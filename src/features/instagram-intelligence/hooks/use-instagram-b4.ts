import { useEffect, useState } from "react";
import { getInstagramB4 } from "../api/instagram-b4-client";
import type { InstagramB4Response } from "../contracts/instagram-b4.schemas";

export function useInstagramB4() {
  const [data, setData] = useState<InstagramB4Response | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    let active = true;
    void getInstagramB4()
      .then((value) => {
        if (active) setData(value);
      })
      .catch(() => {
        if (active)
          setError("Instagram Intelligence is temporarily unavailable.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  return { data, error, isLoading };
}
