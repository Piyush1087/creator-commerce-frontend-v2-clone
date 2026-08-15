import { Alert, Card } from "../../../design-system/aurora";
import type { CampaignShellResponse } from "../contracts/brand-uce.contracts";

export function CampaignReadinessWorkspaceCard({ shell }: { shell: CampaignShellResponse }) {
  const visible = shell.workspace.items.filter((item) => item.visible).sort((a, b) => a.priority - b.priority);
  return (
    <Card eyebrow="Campaign status" title={shell.readiness.ready ? "Campaign ready" : "Campaign setup needed"}>
      {!shell.readiness.ready ? (
        <Alert tone="warning" title="Some requirements still need attention">
          {shell.readiness.missing_requirements.join(", ") || "Campaign setup is incomplete."}
        </Alert>
      ) : null}
      <ul>
        {visible.map((item) => (
          <li key={item.id}>
            <strong>{item.id}</strong> · {item.count}
            {!item.available ? ` · ${item.unavailable_message ?? "Unavailable"}` : ""}
          </li>
        ))}
      </ul>
    </Card>
  );
}
