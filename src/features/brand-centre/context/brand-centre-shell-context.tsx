import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

import {
  DEFAULT_BRAND_CENTRE_TAB_ID,
  getBrandCentreTabById,
  type BrandCentreTabId,
} from "../constants/brand-centre-tabs";

type BrandCentreShellContextValue = {
  activeTabId: BrandCentreTabId;
  setActiveTabId: (tabId: BrandCentreTabId) => void;
};

const BrandCentreShellContext = createContext<BrandCentreShellContextValue | null>(
  null,
);

export function BrandCentreShellProvider({ children }: { children: ReactNode }) {
  const [activeTabId, setActiveTabId] = useState<BrandCentreTabId>(
    DEFAULT_BRAND_CENTRE_TAB_ID,
  );
  const value = useMemo(
    () => ({ activeTabId, setActiveTabId }),
    [activeTabId],
  );

  return (
    <BrandCentreShellContext.Provider value={value}>
      {children}
    </BrandCentreShellContext.Provider>
  );
}

export function useBrandCentreShell(): BrandCentreShellContextValue | null {
  return useContext(BrandCentreShellContext);
}

export function resolveBrandCentreHeaderTitle(tabId: BrandCentreTabId): string {
  return getBrandCentreTabById(tabId).headerTitle;
}
