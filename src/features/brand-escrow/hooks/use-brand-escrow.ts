import { useCallback, useEffect, useState } from "react";

import { fetchBrandGeneralSettings } from "../../settings/api/brand-settings-client";
import {
  fetchBrandReturnRequests,
  fetchBrandReturnSummary,
  fetchEscrowLedger,
  fetchEscrowVault,
} from "../api/brand-escrow-client";
import {
  treasuryRoleSchema,
  type BrandReturnRequestApiResponse,
  type BrandReturnSummaryApiResponse,
  type EscrowVaultApiResponse,
  type TreasuryRole,
} from "../contracts/escrow.contracts";
import type { EscrowLedgerEntry } from "../types";
import { mapLedgerApiEntry } from "../utils/map-ledger-entry";

export type BrandEscrowLoadState = {
  status: "loading" | "ready" | "error";
  vault: EscrowVaultApiResponse | null;
  returnSummary: BrandReturnSummaryApiResponse | null;
  returnRequests: BrandReturnRequestApiResponse[];
  ledger: EscrowLedgerEntry[];
  role: TreasuryRole | null;
  errorMessage: string | null;
  refreshing: boolean;
};

const initialState: BrandEscrowLoadState = {
  status: "loading",
  vault: null,
  returnSummary: null,
  returnRequests: [],
  ledger: [],
  role: null,
  errorMessage: null,
  refreshing: false,
};

export function useBrandEscrow() {
  const [state, setState] = useState(initialState);

  const reload = useCallback(async (manual = false) => {
    setState((current) => ({
      ...current,
      status: current.vault ? current.status : "loading",
      refreshing: manual,
      errorMessage: null,
    }));
    try {
      const [vault, returnSummary, returnRequests, ledger, general] =
        await Promise.all([
          fetchEscrowVault(),
          fetchBrandReturnSummary(),
          fetchBrandReturnRequests(),
          fetchEscrowLedger(),
          fetchBrandGeneralSettings(),
        ]);
      const role = treasuryRoleSchema.safeParse(general);
      if (!role.success) throw new Error("Unexpected Treasury role response.");
      setState({
        status: "ready",
        vault,
        returnSummary,
        returnRequests,
        ledger: ledger.map(mapLedgerApiEntry),
        role: role.data.current_user_role,
        errorMessage: null,
        refreshing: false,
      });
    } catch (error) {
      setState((current) => ({
        ...current,
        status: current.vault ? "ready" : "error",
        errorMessage:
          error instanceof Error
            ? error.message
            : "Treasury state could not be loaded.",
        refreshing: false,
      }));
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    ...state,
    reload,
    // Compatibility for the separate operational Payouts workspace. The canonical
    // Settings read provisions the vault lazily and never credits provider success.
    vaultMissing: false,
    initializing: false,
    processingPayment: false,
    initializeVault: () => reload(true),
    refreshAfterPayment: () => reload(true),
  };
}
