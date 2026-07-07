import { Link } from "react-router-dom";

import { Alert, Button, Card } from "../../../design-system/aurora";
import { AUTH_ROUTES } from "../../auth/constants";
import { fetchMediaKit } from "../api/creator-centre-client";
import { fetchCreatorProfileSettings } from "../../settings/api/creator-settings-client";
import { useCreatorCampaignsWorkspace } from "../../creator-campaigns/hooks/use-creator-campaigns-workspace";
import { displayValue } from "../../creator-campaigns/utils/display-value";
import { useAnalyticsPulse } from "../hooks/use-creator-centre";
import {
  formatPercent,
  formatReach,
} from "../utils/display-value";

import "../creator-centre.css";
import { useEffect, useState } from "react";

export function HomeBriefingWorkspace() {
  const { analytics, loading: analyticsLoading } = useAnalyticsPulse(3);
  const { workspace, loading: workspaceLoading } = useCreatorCampaignsWorkspace();
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [handle, setHandle] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([fetchCreatorProfileSettings(), fetchMediaKit()])
      .then(([profile, kit]) => {
        setDisplayName(profile.profile.display_name ?? null);
        setHandle(kit.instagramHandle ?? null);
      })
      .catch(() => {
        setDisplayName(null);
        setHandle(null);
      });
  }, []);

  const loading = analyticsLoading || workspaceLoading;
  const firstName = displayName?.split(" ")[0] ?? "-";
  const activeRows = workspace?.active_rows ?? [];
  const panicAlerts = workspace?.panic_panel?.alerts ?? [];

  const kpis = [
    {
      label: "Total Reach",
      value: formatReach(analytics?.summary.totalReach ?? null),
      delta: "-",
    },
    {
      label: "Engagements",
      value: formatPercent(analytics?.summary.engagementRate ?? null),
      delta: "-",
    },
    {
      label: "Est. Payout",
      value: "-",
      delta: "-",
    },
  ];

  return (
    <div className="cctr-workspace">
      <p className="cctr-sub">Command Center</p>
      <h1 className="cctr-greeting">Good morning, {firstName}</h1>
      <p className="cctr-sub">
        - · {displayValue(handle)}
      </p>

      {loading ? <p className="cctr-sub">Loading briefing…</p> : null}

      <div className="cctr-kpi-row">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="cctr-kpi">
            <span className="cctr-sub" style={{ margin: 0 }}>
              {kpi.label}
            </span>
            <p className="cctr-kpi__value">{kpi.value}</p>
            <span className="cctr-kpi__delta">{kpi.delta}</span>
          </Card>
        ))}
      </div>

      <div className="cctr-split cctr-split--home">
        <div>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 18 }}>Active campaigns</h2>
          {activeRows.length === 0 ? (
            <p className="cctr-sub" style={{ marginTop: 12 }}>
              -
            </p>
          ) : (
            <ul className="cctr-list" style={{ marginTop: 12 }}>
              {activeRows.map((row) => (
                <li key={row.collaboration_id} className="cctr-list-item">
                  <span>
                    <strong>{displayValue(row.campaign_name)}</strong>
                    <span>
                      {displayValue(row.current_phase)} · {displayValue(row.milestone_label)}
                    </span>
                  </span>
                  <Link to={AUTH_ROUTES.creatorCampaigns}>
                    <Button variant="ghost" size="sm">
                      Open
                    </Button>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <h2
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: 18,
              marginTop: 24,
            }}
          >
            Priority tasks
          </h2>
          {panicAlerts.length === 0 ? (
            <p className="cctr-sub" style={{ marginTop: 12 }}>
              -
            </p>
          ) : (
            <ul className="cctr-list" style={{ marginTop: 12 }}>
              {panicAlerts.map((alert) => (
                <li key={alert.id} className="cctr-list-item">
                  <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input type="checkbox" readOnly />
                    <span>
                      {displayValue(alert.campaign_name)} — {displayValue(alert.current_phase)}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>

        <aside className="cctr-assistant">
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 18, margin: 0 }}>
            Creator Co-Pilot
          </h2>
          <div className="cctr-assistant__alert">
            <strong>{displayValue(analytics?.pulses[0]?.velocityLabel)}</strong>
            <p className="cctr-sub" style={{ margin: "8px 0 0" }}>
              {displayValue(analytics?.pulses[0]?.aiPerformanceNote)}
            </p>
          </div>
          <div>
            <p className="cctr-sub" style={{ marginBottom: 8 }}>
              Content ideas
            </p>
            <ul className="cctr-list">
              <li className="cctr-list-item">
                <span>
                  <strong>-</strong>
                  <span>-</span>
                </span>
              </li>
            </ul>
          </div>
          <Button variant="primary" disabled>
            Yes, schedule
          </Button>
          <Button variant="ghost" disabled>
            Not now
          </Button>
          <p className="cctr-sub" style={{ marginTop: 12 }}>
            Co-pilot chat integration: -
          </p>
        </aside>
      </div>

      {workspace?.panic_panel?.hasUrgentAlerts ? (
        <div style={{ marginTop: 24 }}>
          <Alert tone="warning" title="Urgent campaign actions">
            {workspace.panic_panel.alertCount} item(s) need attention.{" "}
            <Link to={AUTH_ROUTES.creatorCampaigns}>Open campaigns</Link>
          </Alert>
        </div>
      ) : null}
    </div>
  );
}
