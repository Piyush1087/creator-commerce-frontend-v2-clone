import { ChevronDown } from "lucide-react";

export function BrandCentreTabs() {
  const tabs = [
    { id: 'dna', label: 'Tab 1: Brand DNA', active: true },
    { id: 'intelligence', label: 'Tab 2: Intelligence & Gaps' },
    { id: 'planner', label: 'Tab 3: Campaign Planner', badge: '3 Pending' },
  ];

  return (
    <div className="aurora-brand-tabs">
      {/* Desktop Tabs */}
      <div className="aurora-brand-tabs__desktop">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`aurora-brand-tabs__item ${tab.active ? 'aurora-brand-tabs__item--active' : ''}`}
          >
            {tab.label}
            {tab.badge && (
              <span className="aurora-brand-tabs__badge">{tab.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* Mobile Tabs (Dropdown style as per reference) */}
      <div className="aurora-brand-tabs__mobile">
        <button className="aurora-brand-tabs__trigger">
          <span>Tab 1: Brand DNA</span>
          <ChevronDown size={18} />
        </button>
      </div>
    </div>
  );
}
