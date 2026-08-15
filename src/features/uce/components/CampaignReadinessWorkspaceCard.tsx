import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

import { Alert, Button, Card } from "../../../design-system/aurora";
import type { CampaignShellResponse } from "../contracts/brand-uce.contracts";

type WorkspaceId = CampaignShellResponse["workspace"]["items"][number]["id"];

export function CampaignReadinessWorkspaceCard({
  shell,
  renderWorkspace,
}: {
  shell: CampaignShellResponse;
  renderWorkspace: (workspace: WorkspaceId) => React.ReactNode;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const visible = [...shell.workspace.items]
    .filter((item) => item.visible)
    .sort((a, b) => a.priority - b.priority);
  const available = visible.filter((item) => item.available);
  const requested = searchParams.get("workspace");
  const selected =
    available.find((item) => item.id === requested)?.id ??
    available[0]?.id ??
    null;

  useEffect(() => {
    if (!selected || requested === selected) return;
    const next = new URLSearchParams(searchParams);
    next.set("workspace", selected);
    setSearchParams(next, { replace: true });
  }, [requested, searchParams, selected, setSearchParams]);

  return (
    <Card eyebrow="Campaign status" title={shell.readiness.ready ? "Campaign ready" : "Campaign setup needed"}>
      {!shell.readiness.ready ? (
        <Alert tone="warning" title="Some requirements still need attention">
          {shell.readiness.missing_requirements.join(", ") || "Campaign setup is incomplete."}
        </Alert>
      ) : null}
      <nav aria-label="Campaign workspaces">
        {visible.map((item) => (
          <Button
            key={item.id}
            type="button"
            disabled={!item.available}
            aria-pressed={selected === item.id}
            onClick={() => {
              const next = new URLSearchParams(searchParams);
              next.set("workspace", item.id);
              setSearchParams(next);
            }}
          >
            {item.id} · {item.count}
            {!item.available
              ? ` · ${item.unavailable_message ?? "Unavailable"}`
              : ""}
          </Button>
        ))}
      </nav>
      {selected ? renderWorkspace(selected) : (
        <Alert tone="warning" title="Workspace unavailable">
          No Campaign workspace is currently available.
        </Alert>
      )}
    </Card>
  );
}
