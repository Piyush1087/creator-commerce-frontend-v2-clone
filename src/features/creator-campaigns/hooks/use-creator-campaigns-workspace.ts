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

export function useCreatorCampaignsWorkspace({
  currentView,
  searchQuery,
  platformFilter,
  dependencyFilter,
}: CommandCenterQuery = {}) {
  const [workspace, setWorkspace] = useState<CampaignsWorkspaceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchCampaignsWorkspace({
        currentView,
        searchQuery,
        platformFilter,
        dependencyFilter,
      });
      setWorkspace(response);
    } catch (err) {
      setWorkspace(null);
      setError(err instanceof Error ? err.message : "Failed to load workspace.");
    } finally {
      setLoading(false);
    }
  }, [currentView, searchQuery, platformFilter, dependencyFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  return { workspace, loading, error, reload: load };
}

export function useCreatorCampaignsHistory({
  page,
  limit,
  archiveStatus,
}: HistoryArchiveQuery = {}) {
  const [history, setHistory] = useState<CampaignsHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchCampaignsHistory({
        page,
        limit,
        archiveStatus,
      });
      setHistory(response);
    } catch (err) {
      setHistory(null);
      setError(err instanceof Error ? err.message : "Failed to load history.");
    } finally {
      setLoading(false);
    }
  }, [page, limit, archiveStatus]);

  useEffect(() => {
    void load();
  }, [load]);

  return { history, loading, error, reload: load };
}
