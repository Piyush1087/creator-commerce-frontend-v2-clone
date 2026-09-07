import { Button } from "../../../design-system/aurora/components/Button";
import { SideDrawer } from "../../../design-system/aurora/components/SideDrawer";
import {
  EMPTY_MARKETPLACE_FILTERS,
  type MarketplaceFiltersState,
} from "../utils/marketplace-filters";

type MarketplaceFilterDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  filters: MarketplaceFiltersState;
  onChange: (next: MarketplaceFiltersState) => void;
  isGuest?: boolean;
};

const DELIVERABLE_OPTIONS = [
  { value: "", label: "Any deliverable" },
  { value: "INSTAGRAM_REEL", label: "Instagram Reel" },
  { value: "INSTAGRAM_STORY", label: "Instagram Story" },
  { value: "TIKTOK_VIDEO", label: "TikTok Video" },
  { value: "YOUTUBE_SHORTS", label: "YouTube Shorts" },
];

const TIER_OPTIONS = ["NANO", "MICRO", "MID", "MACRO", "MEGA"];
const TIMELINE_OPTIONS = [
  { value: "URGENT_PIPELINE", label: "Urgent pipeline" },
  { value: "STANDARD_RUNWAY", label: "Standard runway" },
];

export function MarketplaceFilterDrawer({
  isOpen,
  onClose,
  filters,
  onChange,
  isGuest = false,
}: MarketplaceFilterDrawerProps) {
  const toggleTier = (tier: string) => {
    const next = filters.creator_tier.includes(tier)
      ? filters.creator_tier.filter((t) => t !== tier)
      : [...filters.creator_tier, tier];
    onChange({ ...filters, creator_tier: next });
  };

  const toggleTimeline = (value: string) => {
    const next = filters.production_timeline.includes(value)
      ? filters.production_timeline.filter((t) => t !== value)
      : [...filters.production_timeline, value];
    onChange({ ...filters, production_timeline: next });
  };

  return (
    <SideDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="More filters"
      subtitle="Refine marketplace discovery"
      width="480px"
      footer={
        <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
          <Button
            variant="ghost"
            onClick={() => onChange(EMPTY_MARKETPLACE_FILTERS)}
          >
            Clear all
          </Button>
          <Button variant="primary" onClick={onClose}>
            Apply filters
          </Button>
        </div>
      }
    >
      <div className="cc-filter-drawer">
        <label className="aurora-field">
          <span className="aurora-field__label">Industry / niche</span>
          <input
            className="aurora-field__control"
            value={filters.niche}
            onChange={(e) => onChange({ ...filters, niche: e.target.value })}
            placeholder="e.g. D2C, beauty, fitness"
          />
        </label>

        <label className="aurora-field">
          <span className="aurora-field__label">Deliverable type</span>
          <select
            className="aurora-select"
            value={filters.deliverable_type}
            onChange={(e) => onChange({ ...filters, deliverable_type: e.target.value })}
          >
            {DELIVERABLE_OPTIONS.map((opt) => (
              <option key={opt.value || "any"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        {!isGuest ? (
          <>
            <p className="cc-filter-drawer__label">Creator tier</p>
            <div className="cc-filter-drawer__chips">
              {TIER_OPTIONS.map((tier) => (
                <button
                  key={tier}
                  type="button"
                  className={`cc-filter-chip ${filters.creator_tier.includes(tier) ? "cc-filter-chip--active" : ""}`}
                  onClick={() => toggleTier(tier)}
                >
                  {tier}
                </button>
              ))}
            </div>
          </>
        ) : null}

        <label className="aurora-field">
          <span className="aurora-field__label">Target geography (ISO-2)</span>
          <input
            className="aurora-field__control"
            value={filters.target_geography}
            onChange={(e) => onChange({ ...filters, target_geography: e.target.value })}
            placeholder="e.g. IN, US"
            maxLength={2}
          />
        </label>

        <p className="cc-filter-drawer__label">Production timeline</p>
        <div className="cc-filter-drawer__chips">
          {TIMELINE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`cc-filter-chip ${filters.production_timeline.includes(opt.value) ? "cc-filter-chip--active" : ""}`}
              onClick={() => toggleTimeline(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </SideDrawer>
  );
}
