import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

import {
  CREATOR_CENTRE_TABS,
  type CreatorCentreTabId,
  getCreatorCentreTabById,
} from "../constants/creator-centre-tabs";

type CreatorCentreTabsProps = {
  activeTabId: CreatorCentreTabId;
  onTabChange: (tabId: CreatorCentreTabId) => void;
};

export function CreatorCentreTabs({
  activeTabId,
  onTabChange,
}: CreatorCentreTabsProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const activeTab = getCreatorCentreTabById(activeTabId);

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

  const selectTab = (tabId: CreatorCentreTabId) => {
    onTabChange(tabId);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="cctr-tabs" ref={rootRef}>
      <div className="cctr-tabs__desktop">
        {CREATOR_CENTRE_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`cctr-tabs__item ${tab.id === activeTabId ? "cctr-tabs__item--active" : ""}`}
            onClick={() => selectTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="cctr-tabs__mobile">
        <button
          type="button"
          className="cctr-tabs__trigger"
          aria-expanded={isMobileMenuOpen}
          aria-controls={menuId}
          onClick={() => setIsMobileMenuOpen((open) => !open)}
        >
          <span>{activeTab.label}</span>
          <ChevronDown
            size={18}
            className={isMobileMenuOpen ? "cctr-tabs__chevron--open" : undefined}
          />
        </button>

        {isMobileMenuOpen ? (
          <div id={menuId} className="cctr-tabs__dropdown" role="menu">
            {CREATOR_CENTRE_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="menuitem"
                className={`cctr-tabs__dropdown-item ${tab.id === activeTabId ? "cctr-tabs__dropdown-item--active" : ""}`}
                onClick={() => selectTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
