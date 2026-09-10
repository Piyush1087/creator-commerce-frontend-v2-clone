import { Alert } from "../../../design-system/aurora/components/Alert";
import { Badge } from "../../../design-system/aurora/components/Badge";
import { Button } from "../../../design-system/aurora/components/Button";
import { Card } from "../../../design-system/aurora/components/Card";
import { useNavigate } from "react-router-dom";
import { useCreatorHome } from "../hooks/use-creator-home";
import { resolveCreatorHomeDestination } from "../navigation/creator-home-destination";
import type {
  CreatorHomeItem,
  CreatorHomeResponse,
} from "../contracts/creator-home.schemas";

const KPI_LABELS: Record<CreatorHomeResponse["kpis"][number]["id"], string> = {
  AVAILABLE_CAMPAIGNS: "Available campaigns",
  APPLICATIONS_IN_PROGRESS: "Applications in progress",
  ACTIVE_COLLABORATIONS: "Active collaborations",
  UNREAD_UPDATES: "Unread updates",
};

const SECTION_LABELS: Record<
  CreatorHomeResponse["sections"][number]["id"],
  string
> = {
  NEEDS_YOUR_ATTENTION: "Needs your attention",
  YOUR_WORK: "Your work",
  CAMPAIGNS_AVAILABLE: "Campaigns available",
  RECENT_ACTIVITY: "Recent activity",
};

function formatTime(value: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function HomeItem({
  item,
  open,
}: {
  item: CreatorHomeItem;
  open: (item: CreatorHomeItem) => void;
}) {
  const disabled =
    item.action?.state === "READ_ONLY" ||
    item.action?.state === "HIDDEN" ||
    !item.action?.destination;
  return (
    <li className="creator-home-item">
      <div className="creator-home-item__copy">
        <div className="creator-home-item__heading">
          <h3>{item.title}</h3>
          {item.status && (
            <Badge tone={item.kind === "ATTENTION" ? "pending" : "neutral"}>
              {item.status.split("_").join(" ")}
            </Badge>
          )}
        </div>
        <p>{item.subtitle}</p>
        <div className="creator-home-item__meta">
          {formatTime(item.occurredAt) && (
            <span>{formatTime(item.occurredAt)}</span>
          )}
          {item.unreadCount !== null && item.unreadCount > 0 && (
            <span>{item.unreadCount} unread</span>
          )}
        </div>
        {disabled && item.action?.reasonCode && (
          <p className="creator-home-item__reason">
            {item.action.reasonCode.split("_").join(" ")}
          </p>
        )}
      </div>
      {item.action?.state !== "HIDDEN" && item.action?.destination && (
        <Button
          variant={disabled ? "disabled" : "outline"}
          size="sm"
          onClick={() => open(item)}
          aria-label={`Open ${item.title}`}
        >
          Open
        </Button>
      )}
    </li>
  );
}

export function CreatorHomeWorkspace() {
  const navigate = useNavigate();
  const { data, loading, refreshing, stale, error, reload } = useCreatorHome();
  const go = (
    destination: CreatorHomeResponse["quickActions"][number]["action"]["destination"],
  ) => {
    if (!destination) return;
    const path = resolveCreatorHomeDestination(destination);
    if (path) navigate(path);
  };
  const openItem = (item: CreatorHomeItem) =>
    go(item.action?.state === "AVAILABLE" ? item.action.destination : null);

  if (loading && !data)
    return (
      <div className="creator-home" aria-busy="true">
        <div className="creator-home-skeleton" />
        <div className="creator-home-skeleton" />
        <div className="creator-home-skeleton" />
      </div>
    );
  if (!data)
    return (
      <div className="creator-home">
        <Alert title="Creator Home is unavailable" tone="error">
          {error ?? "Try again shortly."}
        </Alert>
        <Button onClick={reload}>Try again</Button>
      </div>
    );

  return (
    <div className="creator-home">
      <header className="creator-home-header">
        <div>
          <p className="creator-home-eyebrow">
            {data.creator.workspaceDisplayName}
          </p>
          <h1>Welcome back, {data.creator.displayName}</h1>
          <p>Your Creator work, in one place.</p>
        </div>
        <Button variant="outline" onClick={reload} disabled={refreshing}>
          {refreshing ? "Refreshing…" : "Refresh"}
        </Button>
      </header>
      {stale && (
        <Alert title="Showing your last good view" tone="warning">
          {error ?? "Refresh when your connection is restored."}
        </Alert>
      )}
      {data.status === "PARTIAL" && !stale && (
        <Alert title="Some Creator Home sources are unavailable" tone="warning">
          Healthy sections remain current. Unavailable counts are shown as
          unavailable, not zero.
        </Alert>
      )}
      <section className="creator-home-kpis" aria-label="Creator Home summary">
        {data.kpis.map((kpi) => (
          <Card key={kpi.id} className="creator-home-kpi">
            <p>{KPI_LABELS[kpi.id]}</p>
            <strong>
              {kpi.state === "UNAVAILABLE" ? "Unavailable" : kpi.value}
            </strong>
            <span>{kpi.freshness.toLowerCase()}</span>
          </Card>
        ))}
      </section>
      <nav className="creator-home-actions" aria-label="Quick actions">
        {data.quickActions
          .filter((item) => item.action.state !== "HIDDEN")
          .map((item) => (
            <Button
              key={item.id}
              variant="secondary"
              disabled={item.action.state !== "AVAILABLE"}
              onClick={() => go(item.action.destination)}
            >
              {item.label}
            </Button>
          ))}
      </nav>
      <div className="creator-home-sections">
        {data.sections.map((section) => (
          <Card
            key={section.id}
            title={SECTION_LABELS[section.id]}
            className="creator-home-section"
            action={
              <Badge
                tone={
                  section.state === "UNAVAILABLE"
                    ? "error"
                    : section.state === "PARTIAL"
                      ? "pending"
                      : "neutral"
                }
              >
                {section.state.toLowerCase()}
              </Badge>
            }
          >
            {section.items.length > 0 ? (
              <ul className="creator-home-list">
                {section.items.map((item) => (
                  <HomeItem key={item.id} item={item} open={openItem} />
                ))}
              </ul>
            ) : (
              <p className="creator-home-empty">
                {section.state === "UNAVAILABLE"
                  ? "This section is temporarily unavailable."
                  : "Nothing to show here right now."}
              </p>
            )}
          </Card>
        ))}
      </div>
      {data.truncated && (
        <p className="creator-home-limit">
          Some previews are shortened. KPI totals still reflect the full
          authorized set.
        </p>
      )}
    </div>
  );
}
