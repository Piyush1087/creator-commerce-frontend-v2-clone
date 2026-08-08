import { useMemo } from "react";
import { Link } from "react-router-dom";

import { Alert, Badge, Button, Card } from "../../../design-system/aurora";
import type { BadgeTone } from "../../../design-system/aurora";
import type {
  IdentityTestDryRunResponse,
  IdentityTestTaskResult,
  IdentityTestTaskState,
} from "../contracts/identity-test.contracts";

import "../brand-intelligence.css";

type IdentityTestResultsViewProps = {
  result: IdentityTestDryRunResponse | null;
  onBack?: () => void;
};

function stateTone(
  state: IdentityTestTaskState | IdentityTestDryRunResponse["state"],
): BadgeTone {
  if (state === "SUCCEEDED") return "success";
  if (state === "STOPPED_EXPECTED" || state === "PARTIAL") return "pending";
  if (state === "SKIPPED_DEPENDENCY") return "neutral";
  if (
    state === "FAILED" ||
    state === "FAILED_PRECHECK" ||
    state === "FAILED_PROVIDER" ||
    state === "FAILED_VALIDATION" ||
    state === "FAILED_PERSISTENCE"
  ) {
    return "error";
  }
  return "neutral";
}

/** UI-only family label — never surface concrete provider model IDs. */
function modelFamilyLabel(modelId: string | null): string | null {
  if (!modelId) return null;
  const lower = modelId.toLowerCase();
  if (lower.includes("flash")) return "flash";
  if (lower.includes("pro")) return "pro";
  return "model";
}

function redactModelIdsForDisplay(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redactModelIdsForDisplay);
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value)) {
      if (key === "model_id" && typeof nested === "string") {
        out[key] = modelFamilyLabel(nested) ?? "model";
      } else {
        out[key] = redactModelIdsForDisplay(nested);
      }
    }
    return out;
  }
  return value;
}

function pretty(value: unknown): string {
  try {
    return JSON.stringify(redactModelIdsForDisplay(value), null, 2);
  } catch {
    return String(value);
  }
}

function metaString(
  metadata: Record<string, unknown> | undefined,
  key: string,
): string | null {
  const value = metadata?.[key];
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  return null;
}

function metaList(
  metadata: Record<string, unknown> | undefined,
  key: string,
): string[] {
  const value = metadata?.[key];
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function formatLatencySeconds(
  metadata: Record<string, unknown> | undefined,
): string | null {
  const raw = metadata?.provider_latency_ms;
  if (typeof raw !== "number" || !Number.isFinite(raw) || raw < 0) {
    return null;
  }
  const seconds = raw / 1000;
  const label =
    seconds >= 10 ? seconds.toFixed(0) : seconds.toFixed(1).replace(/\.0$/, "");
  return `${label}s`;
}

function TaskCard({ task }: { task: IdentityTestTaskResult }) {
  const latencyLabel = formatLatencySeconds(task.metadata);
  const modelLabel = modelFamilyLabel(metaString(task.metadata, "model_id"));
  const modelProfile = metaString(task.metadata, "model_profile");
  const provider = metaString(task.metadata, "provider");
  const promptBuildId = metaString(task.metadata, "prompt_build_id");
  const accessMode = metaString(task.metadata, "access_mode");
  const persistenceSkipped = task.metadata?.persistence_skipped;
  const evidenceRefs = metaList(task.metadata, "evidence_refs");
  const artifactVersions = task.metadata?.artifact_versions;
  const validation = task.metadata?.validation;
  const usage = task.metadata?.usage;

  return (
    <Card
      eyebrow={`Task · ${task.taskId}`}
      title={task.taskId}
      action={<Badge tone={stateTone(task.state)}>{task.state}</Badge>}
    >
      <div className="bi-results__meta-chips">
        {modelProfile ? <Badge tone="selected">{modelProfile}</Badge> : null}
        {modelLabel ? <Badge tone="neutral">{modelLabel}</Badge> : null}
        {provider ? <Badge tone="neutral">{provider}</Badge> : null}
        {accessMode ? <Badge tone="neutral">{accessMode}</Badge> : null}
        {latencyLabel ? <Badge tone="pending">{latencyLabel}</Badge> : null}
        {persistenceSkipped === true ? (
          <Badge tone="neutral">persistence skipped</Badge>
        ) : null}
      </div>

      <div className="bi-results__section-stack">
        {task.error ? (
          <Alert tone="error" title={task.error.code}>
            {task.error.message}
          </Alert>
        ) : null}

        {promptBuildId || evidenceRefs.length > 0 ? (
          <dl className="bi-results__grid">
            {promptBuildId ? (
              <div className="bi-results__kv">
                <dt>Prompt build ID</dt>
                <dd>{promptBuildId}</dd>
              </div>
            ) : null}
            {evidenceRefs.length > 0 ? (
              <div className="bi-results__kv">
                <dt>Evidence refs</dt>
                <dd>{evidenceRefs.join(", ")}</dd>
              </div>
            ) : null}
          </dl>
        ) : null}

        {task.values ? (
          <div>
            <h3 className="aurora-card__eyebrow">Validated values</h3>
            <pre className="bi-results__pre">{pretty(task.values)}</pre>
          </div>
        ) : null}

        {validation ? (
          <div>
            <h3 className="aurora-card__eyebrow">Validation</h3>
            <pre className="bi-results__pre">{pretty(validation)}</pre>
          </div>
        ) : null}

        {usage ? (
          <div>
            <h3 className="aurora-card__eyebrow">Provider usage</h3>
            <pre className="bi-results__pre">{pretty(usage)}</pre>
          </div>
        ) : null}

        {artifactVersions ? (
          <div>
            <h3 className="aurora-card__eyebrow">Artifact versions</h3>
            <pre className="bi-results__pre">{pretty(artifactVersions)}</pre>
          </div>
        ) : null}

        {task.metadata ? (
          <details>
            <summary>Full task metadata</summary>
            <pre className="bi-results__pre">{pretty(task.metadata)}</pre>
          </details>
        ) : null}
      </div>
    </Card>
  );
}

export function IdentityTestResultsView({
  result,
  onBack,
}: IdentityTestResultsViewProps) {
  const outputEntries = useMemo(
    () =>
      result
        ? Object.entries(result.validatedOutputs).sort(([a], [b]) =>
            a.localeCompare(b),
          )
        : [],
    [result],
  );

  if (!result) {
    return (
      <div className="bi-results">
        <Card className="bi-results__empty" title="No dry-run result loaded">
          <p>
            Run an Identity dry-run from the homepage, or start again if this
            session was cleared.
          </p>
          <div style={{ marginTop: "1rem" }}>
            <Link to="/" className="aurora-button aurora-button--secondary aurora-button--md">
              Back to homepage
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="bi-results">
      <div className="bi-results__toolbar">
        <div className="bi-results__title-block">
          <h1>Identity dry-run results</h1>
          <p>
            Full <code>identity_test</code> response — execution summary, objects,
            per-task telemetry/evidence metadata, and raw payload.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <Badge tone={stateTone(result.state)}>{result.state}</Badge>
          <Button variant="secondary" onClick={onBack}>
            Run another
          </Button>
        </div>
      </div>

      <Card eyebrow="Execution" title="Run summary">
        <dl className="bi-results__grid">
          <div className="bi-results__kv">
            <dt>Mode</dt>
            <dd>{result.mode}</dd>
          </div>
          <div className="bi-results__kv">
            <dt>Persisted</dt>
            <dd>{result.persisted ? "yes" : "no"}</dd>
          </div>
          <div className="bi-results__kv">
            <dt>Profile</dt>
            <dd>{result.executionProfileId}</dd>
          </div>
          <div className="bi-results__kv">
            <dt>Execution ID</dt>
            <dd>{result.executionId}</dd>
          </div>
          <div className="bi-results__kv">
            <dt>Entity</dt>
            <dd>
              {result.entityType} · {result.entityId}
            </dd>
          </div>
          <div className="bi-results__kv">
            <dt>Website</dt>
            <dd>{result.websiteUrl}</dd>
          </div>
          <div className="bi-results__kv">
            <dt>Tasks</dt>
            <dd>{result.tasks.length}</dd>
          </div>
          <div className="bi-results__kv">
            <dt>Validated objects</dt>
            <dd>{outputEntries.length}</dd>
          </div>
        </dl>
      </Card>

      <Card eyebrow="Intelligence objects" title="Validated outputs">
        {outputEntries.length === 0 ? (
          <Alert tone="warning" title="No validated outputs">
            The run stopped before any canonical outputs were published, or every
            task failed validation.
          </Alert>
        ) : (
          <div className="bi-results__section-stack">
            {outputEntries.map(([key, value]) => (
              <div key={key}>
                <h3 className="aurora-card__eyebrow">{key}</h3>
                <pre className="bi-results__pre">{pretty(value)}</pre>
              </div>
            ))}
          </div>
        )}
      </Card>

      <section className="bi-results__task-list" aria-label="Processor tasks">
        <h2 style={{ margin: 0, fontSize: "1.1rem" }}>
          Processor tasks · timing · telemetry · evidence
        </h2>
        {result.tasks.map((task) => (
          <TaskCard key={task.taskId} task={task} />
        ))}
      </section>

      <Card eyebrow="Debug" title="Raw API response">
        <pre className="bi-results__pre">{pretty(result)}</pre>
      </Card>
    </div>
  );
}
