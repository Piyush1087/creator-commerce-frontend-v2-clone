import { ChevronRight, Download, Search, Send } from "lucide-react";
import { Button } from "../../../../design-system/aurora/components/Button";

const CREATOR_IMG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBhPsy4KMWgRB56itgMD0L96klzBRSqD5ud_llppR_EM57AH7qTm72xy6grORo3bbiQo2Isy8IVGvBcNCDaL641fIHvzNy1e4ttqCIcU5aidY85uAKz0qy5aKfwJUnmd3sm_5agt2prLtfsVXxQgbGk6hBWS3BFRFQNiz213M5PuYraXhjh_UXA6T5Mx6jpvw8-WDARDaBfcInPTd4b4-2qgRDiQTO_nfrHxHJn02bdJLuh37I_UvamAjHBD8ZpcMgO0CCj9TH_BQ";

const MILESTONES = ["Brief", "Contract", "Ship", "Draft", "Review", "Live"];

export function ActiveCollabsTabPanel() {
  return (
    <div className="uce-tab-panel">
      <div className="uce-tab-intro">
        <nav className="uce-tab-crumb">
          <span>Campaigns</span>
          <ChevronRight size={12} />
          <span>Spring Glow 2024</span>
          <ChevronRight size={12} />
          <span className="uce-tab-crumb-active">Active Collabs</span>
        </nav>
        <h2>Active Collabs</h2>
        <p>
          Track production milestones, manage logistics fulfillment, review content
          assets, and authorize milestone escrow distributions.
        </p>
      </div>

      <div className="uce-stat-row uce-stat-row--inline">
        <StatChip icon={<Send size={18} />} label="Active Partnerships" value="3" />
        <StatChip icon={<Download size={18} />} label="Pending Draft Reviews" value="1" />
        <StatChip icon={<Search size={18} />} label="Logistics In Transit" value="2" />
      </div>

      <div className="uce-collabs-controls">
        <div className="uce-search-wrap">
          <Search size={16} />
          <input type="search" placeholder="Search activations by handle..." />
        </div>
        <div className="uce-collabs-actions">
          <Button variant="outline" size="sm">
            Export Manifest
          </Button>
          <Button variant="outline" size="sm" disabled>
            Bulk Nudge Selected
          </Button>
        </div>
      </div>

      <div className="uce-table-wrap">
        <table className="uce-data-table uce-data-table--wide">
          <thead>
            <tr>
              <th className="uce-th-check">
                <input type="checkbox" aria-label="Select all" />
              </th>
              <th>Creator Identity</th>
              <th>Brief &amp; Product Anchor</th>
              <th>Workflow Milestone Track</th>
              <th>Operational Status</th>
              <th>Primary Action Command</th>
            </tr>
          </thead>
          <tbody>
            <CollabRow
              handle="@elenarose_fit"
              brief="Summer Skin Routine"
              product="Hydration Boost Serum"
              doneCount={3}
              activeIndex={3}
              status="Draft Under Review"
              statusClass="uce-pill--amber"
              action="Review Upload"
              actionPrimary
            />
            <CollabRow
              handle="@clara_vibe"
              brief="Summer Skin Routine"
              product="Hydration Boost Serum"
              doneCount={2}
              activeIndex={2}
              status="Logistics: En Route"
              statusClass="uce-pill--blue"
              action="Add Tracking"
            />
            <CollabRow
              handle="@marcus_vlogs"
              brief="Summer Solstice Core"
              product="Glow Serum Premium V2"
              doneCount={5}
              activeIndex={5}
              status="Live — Monitoring"
              statusClass="uce-pill--emerald"
              action="View Performance"
            />
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatChip({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="uce-inline-stat">
      <span className="uce-inline-stat-icon">{icon}</span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function CollabRow({
  handle,
  brief,
  product,
  doneCount,
  activeIndex,
  status,
  statusClass,
  action,
  actionPrimary,
}: {
  handle: string;
  brief: string;
  product: string;
  doneCount: number;
  activeIndex: number;
  status: string;
  statusClass: string;
  action: string;
  actionPrimary?: boolean;
}) {
  return (
    <tr>
      <td>
        <input type="checkbox" />
      </td>
      <td>
        <div className="uce-creator-cell">
          <img src={CREATOR_IMG} alt="" className="uce-creator-avatar" />
          <strong>{handle}</strong>
        </div>
      </td>
      <td>
        <div className="uce-cell-stack">
          <strong>{brief}</strong>
          <span>{product}</span>
        </div>
      </td>
      <td>
        <div className="uce-milestone-track" title={MILESTONES.join(" → ")}>
          {MILESTONES.map((label, i) => (
            <span
              key={label}
              className={`uce-milestone-dot ${
                i < doneCount ? "is-done" : i === activeIndex ? "is-active" : ""
              }`}
              title={label}
            />
          ))}
        </div>
      </td>
      <td>
        <span className={`uce-pill ${statusClass}`}>{status}</span>
      </td>
      <td>
        <Button variant={actionPrimary ? "primary" : "outline"} size="sm">
          {action}
        </Button>
      </td>
    </tr>
  );
}
