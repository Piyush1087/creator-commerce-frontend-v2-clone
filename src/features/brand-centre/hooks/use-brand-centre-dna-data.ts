import { useCallback, useEffect, useState } from "react";

import {
  fetchBrandCentreAccount,
  fetchBrandCentreBudget,
  fetchBrandCentreDna,
  fetchBrandCentreScanStatus,
} from "../api/brand-centre-client";
import type { BrandCentreScanStatusResponse } from "../contracts/brand-centre.contracts";
import type { BrandCentreViewModel } from "../types";
import { mapBrandCentreView } from "../utils/map-brand-centre-view";

const SCAN_POLL_MS = 8_000;

export type BrandCentreDnaLoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; view: BrandCentreViewModel };

function isDeepScanActive(scan: BrandCentreScanStatusResponse | null): boolean {
  if (!scan) {
    return false;
  }
  if (scan.scanStatus === "DEEP_SCAN_IN_PROGRESS") {
    return true;
  }
  const job = scan.job;
  return job?.status === "QUEUED" || job?.status === "RUNNING";
}

export function useBrandCentreDnaData() {
  const [loadState, setLoadState] = useState<BrandCentreDnaLoadState>({
    status: "loading",
  });
  const [scanStatus, setScanStatus] =
    useState<BrandCentreScanStatusResponse | null>(null);

  const loadAll = useCallback(async () => {
    const [dna, account, scan] = await Promise.all([
      fetchBrandCentreDna(),
      fetchBrandCentreAccount(),
      fetchBrandCentreScanStatus(),
    ]);

    let budget = null;
    try {
      budget = await fetchBrandCentreBudget();
    } catch {
      budget = null;
    }

    setScanStatus(scan);
    setLoadState({
      status: "ready",
      view: mapBrandCentreView(dna, budget, account),
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        await loadAll();
      } catch (err) {
        if (!cancelled) {
          setLoadState({
            status: "error",
            message:
              err instanceof Error
                ? err.message
                : "Could not load Brand Centre data.",
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loadAll]);

  useEffect(() => {
    if (!isDeepScanActive(scanStatus)) {
      return;
    }

    const timer = window.setInterval(() => {
      void (async () => {
        try {
          const nextScan = await fetchBrandCentreScanStatus();
          setScanStatus(nextScan);
          if (!isDeepScanActive(nextScan)) {
            await loadAll();
          }
        } catch {
          // keep polling; transient errors are ok for this temporary banner
        }
      })();
    }, SCAN_POLL_MS);

    return () => window.clearInterval(timer);
  }, [loadAll, scanStatus]);

  return {
    loadState,
    scanStatus,
    isDeepScanRunning: isDeepScanActive(scanStatus),
    reload: loadAll,
  };
}
