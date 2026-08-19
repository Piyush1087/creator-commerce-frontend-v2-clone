import type { ReactNode } from "react";

import { Badge } from "../../../design-system/aurora";
import type { CampaignPageView, CampaignWorkspaceId } from "./types";

const workspaceLabels: Record<CampaignWorkspaceId, string> = {
  discovery: "Discovery",
  applicants: "Applicants",
  collaborations: "Collaborations",
};

export function CampaignWorkspaceShell({
  workspaces,
  activeWorkspace,
  onSelect,
  children,
}: {
  workspaces: CampaignPageView["workspaces"];
  activeWorkspace: CampaignWorkspaceId;
  onSelect: (workspace: CampaignWorkspaceId) => void;
  children: ReactNode;
}) {
  const active = workspaces.find((item) => item.workspace === activeWorkspace);

  return (
    <section className="canonical-campaign-page__workspace-shell">
      <div
        aria-label="Campaign workspaces"
        className="canonical-campaign-page__workspace-tabs"
        role="tablist"
      >
        {workspaces.map((item) => {
          const selected = item.workspace === activeWorkspace;
          return (
            <button
              aria-controls="campaign-active-workspace"
              aria-selected={selected}
              className="canonical-campaign-page__workspace-tab"
              id={`campaign-workspace-tab-${item.workspace}`}
              key={item.workspace}
              onClick={() => onSelect(item.workspace)}
              role="tab"
              type="button"
            >
              <span>{workspaceLabels[item.workspace]}</span>
              {item.count != null ? (
                <Badge tone={selected ? "selected" : "neutral"}>
                  {item.count}
                </Badge>
              ) : null}
              <span className="canonical-campaign-page__workspace-state">
                {item.state}
              </span>
            </button>
          );
        })}
      </div>

      <div
        aria-labelledby={`campaign-workspace-tab-${activeWorkspace}`}
        className="canonical-campaign-page__workspace-body"
        data-workspace={activeWorkspace}
        id="campaign-active-workspace"
        role="tabpanel"
      >
        <header className="canonical-campaign-page__workspace-heading">
          <div>
            <p className="canonical-campaign-page__eyebrow">
              Campaign workspace
            </p>
            <h2>{workspaceLabels[activeWorkspace]}</h2>
          </div>
          {active ? <Badge tone="neutral">{active.state}</Badge> : null}
        </header>
        {children}
      </div>
    </section>
  );
}
