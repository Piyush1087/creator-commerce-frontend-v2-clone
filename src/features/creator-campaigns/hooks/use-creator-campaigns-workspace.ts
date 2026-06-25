import { useCallback, useEffect, useState } from "react";

import {
  fetchCampaignsHistory,
  fetchCampaignsWorkspace,
} from "../api/creator-campaigns-client";
import type {
  CampaignsHistoryResponse,
  CampaignsWorkspaceResponse,
} from "../contracts/creator-campaigns.contracts";

export function useCreatorCampaignsWorkspace() {
  const [workspace, setWorkspace] = useState<CampaignsWorkspaceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchCampaignsWorkspace();
      setWorkspace(response);
    } catch (err) {
      setWorkspace(null);
      setError(err instanceof Error ? err.message : "Failed to load workspace.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { workspace, loading, error, reload: load };
}

export function useCreatorCampaignsHistory() {
  const [history, setHistory] = useState<CampaignsHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchCampaignsHistory();
      setHistory(response);
    } catch (err) {
      setHistory(null);
      setError(err instanceof Error ? err.message : "Failed to load history.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { history, loading, error, reload: load };
}
