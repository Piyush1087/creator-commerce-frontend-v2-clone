import { useState } from "react";
import {
  CheckCircle,
  ChevronRight,
  Eye,
  Flame,
  MoreHorizontal,
  Search,
  XCircle,
} from "lucide-react";
import { Button } from "../../../../design-system/aurora/components/Button";
import { ApplicantVettingDrawer } from "../ApplicantVettingDrawer";

const CREATOR_IMG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBhPsy4KMWgRB56itgMD0L96klzBRSqD5ud_llppR_EM57AH7qTm72xy6grORo3bbiQo2Isy8IVGvBcNCDaL641fIHvzNy1e4ttqCIcU5aidY85uAKz0qy5aKfwJUnmd3sm_5agt2prLtfsVXxQgbGk6hBWS3BFRFQNiz213M5PuYraXhjh_UXA6T5Mx6jpvw8-WDARDaBfcInPTd4b4-2qgRDiQTO_nfrHxHJn02bdJLuh37I_UvamAjHBD8ZpcMgO0CCj9TH_BQ";

export function ApplicantsTabPanel() {
  const [vettingOpen, setVettingOpen] = useState(false);
  const [selectedHandle, setSelectedHandle] = useState("@sophia_creates");

  return (
    <>
      <div className="uce-tab-panel">
        <div className="uce-tab-intro">
          <nav className="uce-tab-crumb">
            <span>Campaigns</span>
            <ChevronRight size={12} />
            <span>Spring Glow 2024</span>
            <ChevronRight size={12} />
            <span className="uce-tab-crumb-active">Applicants</span>
          </nav>
          <h2>Applicants</h2>
          <p>
            Review, vet, and advance authenticated creators who have accepted your
            invitations or applied directly via your shared campaign links.
          </p>
        </div>

        <div className="uce-vetting-strip">
          <div className="uce-vetting-chip uce-vetting-chip--slate">
            <span>Total Dynamic Applicants:</span>
            <strong>2 Profiles</strong>
          </div>
          <div className="uce-vetting-chip uce-vetting-chip--emerald">
            <span>Average Core Match Index:</span>
            <strong>84% Fit Grade</strong>
          </div>
          <div className="uce-vetting-chip uce-vetting-chip--amber">
            <span>Awaiting Triage Review:</span>
            <strong>2 Profiles</strong>
          </div>
        </div>

        <div className="uce-applicants-controls">
          <div className="uce-applicants-filters">
            <select className="uce-select" defaultValue="all-briefs">
              <option value="all-briefs">All Briefs</option>
            </select>
            <select className="uce-select" defaultValue="pending">
              <option value="pending">Operational Status (Pending Review)</option>
            </select>
            <div className="uce-search-wrap">
              <Search size={16} />
              <input type="search" placeholder="Search profiles by handle..." />
            </div>
          </div>
          <div className="uce-applicants-bulk">
            <Button variant="outline" disabled>
              Bulk Approve &amp; Initialize Negotiation
            </Button>
            <Button variant="outline" disabled>
              Bulk Decline Applications
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
                <th>Creator Identity / Handle</th>
                <th>Application Origin</th>
                <th>AI Target Match Index</th>
                <th className="uce-hide-md">Campaign Component Focus</th>
                <th className="uce-hide-md">Baseline Compensation</th>
                <th className="uce-hide-md">AI Triage Flag</th>
                <th className="uce-hide-md">Workspace Actions</th>
                <th>Deep Drill-Down</th>
              </tr>
            </thead>
            <tbody>
              <ApplicantRow
                handle="@sophia_creates"
                tag="NEW"
                sub="Unread Applicant"
                origin="Organic Inbound"
                originClass="uce-pill--blue"
                match="89%"
                product="Glow Serum Premium V2"
                brief="Summer Solstice Core"
                fee="$450.00 USD"
                flagIcon={<Flame size={14} />}
                flag="High Saves-to-Likes"
                onInspect={() => {
                  setSelectedHandle("@sophia_creates");
                  setVettingOpen(true);
                }}
              />
              <ApplicantRow
                handle="@marcus_vlogs"
                sub="Applied: May 28, 2026"
                origin="Outbound Invite"
                originClass="uce-pill--purple"
                match="76%"
                product="Hydration Booster Pack"
                brief="Summer Solstice Core"
                fee="$600.00 USD"
                flagIcon={<Flame size={14} />}
                flag="Strong Story CTR"
                onInspect={() => {
                  setSelectedHandle("@marcus_vlogs");
                  setVettingOpen(true);
                }}
              />
            </tbody>
          </table>
        </div>
      </div>

      <ApplicantVettingDrawer
        isOpen={vettingOpen}
        onClose={() => setVettingOpen(false)}
        instagramHandle={selectedHandle}
      />
    </>
  );
}

function ApplicantRow({
  handle,
  tag,
  sub,
  origin,
  originClass,
  match,
  product,
  brief,
  fee,
  flagIcon,
  flag,
  onInspect,
}: {
  handle: string;
  tag?: string;
  sub: string;
  origin: string;
  originClass: string;
  match: string;
  product: string;
  brief: string;
  fee: string;
  flagIcon: React.ReactNode;
  flag: string;
  onInspect: () => void;
}) {
  return (
    <tr>
      <td>
        <input type="checkbox" />
      </td>
      <td>
        <div className="uce-creator-cell">
          <img src={CREATOR_IMG} alt="" className="uce-creator-avatar" />
          <div>
            <strong>
              {handle}{" "}
              {tag && <span className="uce-new-tag">{tag}</span>}
            </strong>
            <span>{sub}</span>
          </div>
        </div>
      </td>
      <td>
        <span className={`uce-pill ${originClass}`}>{origin}</span>
      </td>
      <td>
        <span className="uce-match-grade">
          <span className="uce-match-dot" /> {match}
        </span>
      </td>
      <td className="uce-hide-md">
        <div className="uce-cell-stack">
          <strong>{product}</strong>
          <span>{brief}</span>
        </div>
      </td>
      <td className="uce-hide-md">
        <div className="uce-cell-stack">
          <strong>{fee}</strong>
          <span>Fixed Flat Fee CPM</span>
        </div>
      </td>
      <td className="uce-hide-md">
        <span className="uce-triage-flag">
          {flagIcon} {flag}
        </span>
      </td>
      <td className="uce-hide-md">
        <div className="uce-row-icon-actions">
          <button type="button" className="uce-icon-action uce-icon-action--ok" aria-label="Approve">
            <CheckCircle size={20} />
          </button>
          <button type="button" className="uce-icon-action uce-icon-action--bad" aria-label="Decline">
            <XCircle size={20} />
          </button>
        </div>
      </td>
      <td>
        <button type="button" className="uce-icon-plain" onClick={onInspect} aria-label="View details">
          <Eye size={18} />
        </button>
      </td>
    </tr>
  );
}
