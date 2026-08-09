import { useCallback, useEffect, useState } from "react";

import {
  fetchCampaignsHistory,
  fetchCampaignsWorkspace,
} from "../api/creator-campaigns-client";
import type {
  CampaignsHistoryResponse,
  CampaignsWorkspaceResponse,
  CommandCenterQuery,
  HistoryArchiveQuery,
} from "../contracts/creator-campaigns.contracts";

export function useCreatorCampaignsWorkspace(query: CommandCenterQuery = {}) {
  const [workspace, setWorkspace] = useState<CampaignsWorkspaceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchCampaignsWorkspace(query);
      setWorkspace(response);
    } catch (err) {
      setWorkspace(null);
      setError(err instanceof Error ? err.message : "Failed to load workspace.");
    } finally {
      setLoading(false);
    }
  }, [query.currentView, query.searchQuery, query.platformFilter, query.dependencyFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  return { workspace, loading, error, reload: load };
}

export function useCreatorCampaignsHistory(query: HistoryArchiveQuery = {}) {
  const [history, setHistory] = useState<CampaignsHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchCampaignsHistory(query);
      setHistory(response);
    } catch (err) {
      setHistory(null);
      setError(err instanceof Error ? err.message : "Failed to load history.");
    } finally {
      setLoading(false);
    }
  }, [query.page, query.limit, query.archiveStatus]);

  useEffect(() => {
    void load();
  }, [load]);

  return { history, loading, error, reload: load };
}
