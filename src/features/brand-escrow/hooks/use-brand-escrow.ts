import { useCallback, useEffect, useState } from "react";

import {
  EscrowApiError,
  fetchEscrowLedger,
  fetchEscrowVault,
  initializeEscrowVault,
} from "../api/brand-escrow-client";
import type { EscrowVaultApiResponse } from "../contracts/escrow.contracts";
import type { EscrowLedgerEntry } from "../types";
import { mapLedgerApiEntry } from "../utils/map-ledger-entry";

export type BrandEscrowLoadState = {
  status: "loading" | "ready" | "error";
  vault: EscrowVaultApiResponse | null;
  vaultMissing: boolean;
  ledger: EscrowLedgerEntry[];
  errorMessage: string | null;
  initializing: boolean;
  processingPayment: boolean;
};

export function useBrandEscrow() {
  const [state, setState] = useState<BrandEscrowLoadState>({
    status: "loading",
    vault: null,
    vaultMissing: false,
    ledger: [],
    errorMessage: null,
    initializing: false,
    processingPayment: false,
  });

  const loadVault = useCallback(async () => {
    try {
      const vault = await fetchEscrowVault();
      setState((current) => ({
        ...current,
        vault,
        vaultMissing: false,
        errorMessage: null,
      }));
      return vault;
    } catch (error) {
      if (error instanceof EscrowApiError && error.status === 404) {
        setState((current) => ({
          ...current,
          vault: null,
          vaultMissing: true,
          errorMessage: null,
        }));
        return null;
      }
      const message =
        error instanceof Error ? error.message : "Failed to load escrow vault.";
      setState((current) => ({
        ...current,
        errorMessage: message,
      }));
      throw error;
    }
  }, []);

  const loadLedger = useCallback(async () => {
    try {
      const entries = await fetchEscrowLedger();
      setState((current) => ({
        ...current,
        ledger: entries.map(mapLedgerApiEntry),
      }));
    } catch (error) {
      if (error instanceof EscrowApiError && error.status === 404) {
        setState((current) => ({
          ...current,
          ledger: [],
        }));
        return;
      }
      throw error;
    }
  }, []);

  const reload = useCallback(async () => {
    setState((current) => ({ ...current, status: "loading", errorMessage: null }));
    try {
      const vault = await loadVault();
      if (vault) {
        await loadLedger();
      } else {
        setState((current) => ({ ...current, ledger: [] }));
      }
      setState((current) => ({ ...current, status: "ready" }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load escrow data.";
      setState((current) => ({
        ...current,
        status: "error",
        errorMessage: message,
      }));
    }
  }, [loadLedger, loadVault]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const initializeVault = useCallback(async () => {
    setState((current) => ({ ...current, initializing: true, errorMessage: null }));
    try {
      const vault = await initializeEscrowVault();
      setState((current) => ({
        ...current,
        vault,
        vaultMissing: false,
        initializing: false,
      }));
      await loadLedger();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to initialize escrow vault.";
      setState((current) => ({
        ...current,
        initializing: false,
        errorMessage: message,
      }));
      throw error;
    }
  }, [loadLedger]);

  const setProcessingPayment = useCallback((processingPayment: boolean) => {
    setState((current) => ({ ...current, processingPayment }));
  }, []);

  const refreshAfterPayment = useCallback(async () => {
    setProcessingPayment(true);
    try {
      await loadVault();
      await loadLedger();
    } finally {
      setProcessingPayment(false);
    }
  }, [loadLedger, loadVault, setProcessingPayment]);

  return {
    ...state,
    reload,
    initializeVault,
    loadLedger,
    refreshAfterPayment,
    setProcessingPayment,
  };
}
