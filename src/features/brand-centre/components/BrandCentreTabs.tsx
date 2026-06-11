import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

import {
  BRAND_CENTRE_TABS,
  type BrandCentreTabId,
  getBrandCentreTabById,
} from "../constants/brand-centre-tabs";

type BrandCentreTabsProps = {
  activeTabId: BrandCentreTabId;
  onTabChange?: (tabId: BrandCentreTabId) => void;
};

export function BrandCentreTabs({ activeTabId, onTabChange }: BrandCentreTabsProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const activeTab = getBrandCentreTabById(activeTabId);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isMobileMenuOpen]);

  const selectTab = (tabId: BrandCentreTabId) => {
    onTabChange?.(tabId);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="aurora-brand-tabs" ref={rootRef}>
      <div className="aurora-brand-tabs__desktop">
        {BRAND_CENTRE_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`aurora-brand-tabs__item ${tab.id === activeTabId ? "aurora-brand-tabs__item--active" : ""}`}
            onClick={() => selectTab(tab.id)}
          >
            {tab.label}
            {tab.badge ? (
              <span className="aurora-brand-tabs__badge">{tab.badge}</span>
            ) : null}
          </button>
        ))}
      </div>

      <div className="aurora-brand-tabs__mobile">
        <button
          type="button"
          className="aurora-brand-tabs__trigger"
          aria-expanded={isMobileMenuOpen}
          aria-controls={menuId}
          onClick={() => setIsMobileMenuOpen((open) => !open)}
        >
          <span>{activeTab.label}</span>
          <ChevronDown
            size={18}
            className={isMobileMenuOpen ? "aurora-brand-tabs__chevron--open" : undefined}
          />
        </button>

        {isMobileMenuOpen ? (
          <div id={menuId} className="aurora-brand-tabs__dropdown" role="menu">
            {BRAND_CENTRE_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="menuitem"
                className={`aurora-brand-tabs__dropdown-item ${tab.id === activeTabId ? "aurora-brand-tabs__dropdown-item--active" : ""}`}
                onClick={() => selectTab(tab.id)}
              >
                <span>{tab.label}</span>
                {tab.badge ? (
                  <span className="aurora-brand-tabs__badge">{tab.badge}</span>
                ) : null}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
