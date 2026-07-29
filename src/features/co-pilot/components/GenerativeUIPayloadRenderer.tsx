import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import type { BadgeTone } from "../../../design-system/aurora";
import { Alert, Badge, Button, Card, TextField } from "../../../design-system/aurora";
import { AUTH_ROUTES } from "../../../features/auth/constants";
import type {
  CoPilotChatPayload,
  DataTableData,
  MetricItem,
  SlotField,
  ValidationChecklistData,
} from "../schemas/co-pilot-payload.schema";

type Props = {
  payload: CoPilotChatPayload;
  hitlBusyKey?: string | null;
  resolvedHitlKeys?: ReadonlySet<string>;
  onConfirmHitl?: (idempotencyKey: string) => void;
  onDiscardHitl?: (idempotencyKey: string) => void;
  onSubmitSlotValues?: (slotValues: Record<string, string>) => void;
  slotSubmitBusy?: boolean;
};

function metricTone(statusColor: MetricItem["statusColor"]): BadgeTone {
  switch (statusColor) {
    case "GREEN":
      return "success";
    case "YELLOW":
      return "pending";
    case "RED":
      return "error";
    default:
      return "neutral";
  }
}

function formatObjective(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function formatPrefillLabel(key: string): string {
  return key
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatSelectOptionLabel(option: string): string {
  const separator = option.indexOf("::");
  if (separator >= 0) {
    return option.slice(separator + 2).trim();
  }
  return formatObjective(option);
}

function formatPrefillValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map((entry) => formatPrefillValue(entry)).join(", ");
  }
  if (typeof value === "number") {
    return value.toLocaleString();
  }
  if (typeof value === "string") {
    if (value.includes("::")) {
      return formatSelectOptionLabel(value);
    }
    return value.includes("_") ? formatObjective(value) : value;
  }
  return String(value);
}

function formatCellValue(value: string | number | boolean | undefined): string {
  if (value == null) {
    return "—";
  }
  if (typeof value === "number") {
    return Number.isInteger(value)
      ? value.toLocaleString()
      : value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return "—";
  }
  if (/^[A-Z0-9]+(?:_[A-Z0-9]+)+$/.test(trimmed)) {
    return formatObjective(trimmed);
  }
  return trimmed;
}

function statusBadgeTone(status: string): BadgeTone {
  const n = status.toUpperCase();
  if (n === "ACTIVE" || n === "COMPLETED" || n === "RELEASED") {
    return "success";
  }
  if (n === "PAUSED" || n === "PENDING" || n === "DRAFT") {
    return "pending";
  }
  if (n === "ARCHIVED" || n === "FAILED" || n === "REJECTED") {
    return "error";
  }
  return "neutral";
}

function pickTitleHeader(headers: string[]): string {
  const preferred = headers.find((header) =>
    /^(campaign|name|title|leak|product|creator|entity|card)/i.test(header),
  );
  return preferred ?? headers[0] ?? "Item";
}

function pickStatusHeader(headers: string[]): string | null {
  return headers.find((header) => /status/i.test(header)) ?? null;
}

function pickHighlightHeaders(headers: string[], titleHeader: string, statusHeader: string | null): string[] {
  const candidates = headers.filter(
    (header) =>
      header !== titleHeader &&
      header !== statusHeader &&
      /^(budget|spend|utilization|remaining|impressions|active collabs|amount|balance)/i.test(
        header,
      ),
  );
  return candidates.slice(0, 3);
}

function MetricHighlightGrid({ metrics }: { metrics: MetricItem[] }) {
  return (
    <div className="co-pilot-metric-grid" role="list">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          role="listitem"
          className={`co-pilot-metric-grid__item co-pilot-metric-grid__item--${metric.statusColor.toLowerCase()}`}
        >
          <div className="co-pilot-metric-grid__head">
            <span className="co-pilot-metric-grid__label">{metric.label}</span>
            {metric.statusColor !== "NEUTRAL" ? (
              <Badge
                tone={metricTone(metric.statusColor)}
                className="co-pilot-metric-grid__badge"
              >
                {metric.statusColor.toLowerCase()}
              </Badge>
            ) : null}
          </div>
          <strong className="co-pilot-metric-grid__value">
            {formatCellValue(metric.value)}
          </strong>
          {typeof metric.changePercentage === "number" ? (
            <span className="co-pilot-metric-grid__delta">
              {metric.changePercentage > 0 ? "+" : ""}
              {metric.changePercentage}%
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

/**
 * Chat-friendly entity cards for any TABULAR_AUDIT_DATA payload.
 * Avoids cramped multi-column tables inside the agent bubble.
 */
function AuditEntityCards({ table }: { table: DataTableData }) {
  const titleHeader = pickTitleHeader(table.headers);
  const statusHeader = pickStatusHeader(table.headers);
  const highlightHeaders = pickHighlightHeaders(
    table.headers,
    titleHeader,
    statusHeader,
  );
  const detailHeaders = table.headers.filter(
    (header) =>
      header !== titleHeader &&
      header !== statusHeader &&
      !highlightHeaders.includes(header),
  );

  if (table.rows.length === 0) {
    return (
      <div className="co-pilot-audit-cards co-pilot-audit-cards--empty">
        <p className="co-pilot-audit-cards__empty">No rows to show.</p>
      </div>
    );
  }

  return (
    <ul className="co-pilot-audit-cards" aria-label="Results">
      {table.rows.map((row, index) => {
        const title = formatCellValue(row[titleHeader]);
        const statusRaw =
          statusHeader != null ? String(row[statusHeader] ?? "").trim() : "";
        const statusLabel = statusRaw ? formatCellValue(statusRaw) : null;

        return (
          <li key={`${title}-${index}`} className="co-pilot-audit-card">
            <div className="co-pilot-audit-card__top">
              <div className="co-pilot-audit-card__identity">
                <p className="co-pilot-audit-card__title">{title}</p>
                {statusLabel ? (
                  <Badge tone={statusBadgeTone(statusRaw)}>
                    {statusLabel}
                  </Badge>
                ) : null}
              </div>
              {highlightHeaders.length > 0 ? (
                <div className="co-pilot-audit-card__highlights">
                  {highlightHeaders.map((header) => (
                    <div key={header} className="co-pilot-audit-card__stat">
                      <span className="co-pilot-audit-card__stat-label">
                        {header}
                      </span>
                      <strong className="co-pilot-audit-card__stat-value">
                        {formatCellValue(row[header])}
                      </strong>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
            {detailHeaders.length > 0 ? (
              <dl className="co-pilot-audit-card__details">
                {detailHeaders.map((header) => (
                  <div key={header} className="co-pilot-audit-card__detail">
                    <dt>{header}</dt>
                    <dd>{formatCellValue(row[header])}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function SlotFieldControl({
  field,
  value,
  onChange,
}: {
  field: SlotField;
  value: string;
  onChange: (value: string) => void;
}) {
  if (field.inputType === "SINGLE_SELECT") {
    const options = field.selectOptions ?? [];
    return (
      <fieldset className="co-pilot-slot-list">
        <legend className="co-pilot-slot-list__legend">{field.uiLabel}</legend>
        {field.placeholderText ? (
          <p className="co-pilot-slot-list__hint">{field.placeholderText}</p>
        ) : null}
        <ul className="co-pilot-slot-list__options" role="listbox" aria-label={field.uiLabel}>
          {options.map((option) => {
            const selected = value === option;
            return (
              <li key={option}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={`co-pilot-slot-list__option${selected ? " co-pilot-slot-list__option--selected" : ""}`}
                  onClick={() => onChange(option)}
                >
                  <span className="co-pilot-slot-list__option-label">
                    {formatSelectOptionLabel(option)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </fieldset>
    );
  }

  return (
    <TextField
      label={field.uiLabel}
      type={field.inputType === "NUMBER" ? "number" : "text"}
      placeholder={field.placeholderText}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function SlotFillingForm({
  payload,
  busy,
  onSubmit,
}: {
  payload: CoPilotChatPayload;
  busy?: boolean;
  onSubmit?: (slotValues: Record<string, string>) => void;
}) {
  const slotData = payload.slotFillingData;
  const initialValues = useMemo(() => {
    const values: Record<string, string> = {};
    if (!slotData) {
      return values;
    }
    for (const field of slotData.missingSlots) {
      const staged = slotData.stagedPayload[field.fieldName];
      values[field.fieldName] =
        staged != null && staged !== undefined ? String(staged) : "";
    }
    return values;
  }, [slotData]);

  const [values, setValues] = useState(initialValues);

  if (!slotData) {
    return null;
  }

  const canSubmit = slotData.missingSlots.every((field) => {
    const value = values[field.fieldName]?.trim() ?? "";
    return value.length > 0;
  });

  return (
    <form
      className="co-pilot-slot-form"
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSubmit || !onSubmit) {
          return;
        }
        onSubmit(values);
      }}
    >
      {slotData.missingSlots.map((field) => (
        <SlotFieldControl
          key={field.fieldName}
          field={field}
          value={values[field.fieldName] ?? ""}
          onChange={(next) => {
            setValues((prev) => ({ ...prev, [field.fieldName]: next }));
          }}
        />
      ))}
      <Button type="submit" size="sm" disabled={!canSubmit || busy}>
        {busy ? "Submitting…" : "Continue"}
      </Button>
    </form>
  );
}

function ValidationChecklistPanel({
  data,
  busyKey,
  onRetry,
  onDiscard,
}: {
  data: ValidationChecklistData;
  busyKey?: string | null;
  onRetry?: (idempotencyKey: string) => void;
  onDiscard?: (idempotencyKey: string) => void;
}) {
  const pending = data.items.filter((item) => !item.satisfied);
  const done = data.items.filter((item) => item.satisfied);
  const isBusy =
    data.idempotencyKey != null && busyKey === data.idempotencyKey;
  const campaignHref =
    data.deepLinkPath ??
    (data.campaignId != null
      ? AUTH_ROUTES.brandUceCampaignDetail.replace(":id", data.campaignId)
      : null);

  return (
    <div className="co-pilot-validation-checklist">
      <div className="co-pilot-validation-checklist__head">
        <h3 className="co-pilot-validation-checklist__title">{data.title}</h3>
        {data.campaignName ? (
          <p className="co-pilot-validation-checklist__campaign">
            {data.campaignName}
          </p>
        ) : null}
      </div>
      <ul className="co-pilot-validation-checklist__items">
        {[...done, ...pending].map((item) => (
          <li
            key={item.id}
            className={`co-pilot-validation-checklist__item${
              item.satisfied
                ? " co-pilot-validation-checklist__item--done"
                : " co-pilot-validation-checklist__item--pending"
            }`}
          >
            <span className="co-pilot-validation-checklist__mark" aria-hidden>
              {item.satisfied ? "✓" : "☐"}
            </span>
            <div className="co-pilot-validation-checklist__body">
              <strong>{item.title}</strong>
              {item.helpText ? <p>{item.helpText}</p> : null}
              {!item.satisfied && item.repairHint ? (
                <p className="co-pilot-validation-checklist__hint">
                  {item.repairHint}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
      {campaignHref ? (
        <p className="co-pilot-validation-checklist__link-wrap">
          <Link className="co-pilot-hitl-widget__link" to={campaignHref}>
            {data.deepLinkPath?.includes("/collaborations")
              ? "Open collaboration to fix"
              : "Open campaign to fix"}
          </Link>
        </p>
      ) : null}
      {data.idempotencyKey ? (
        <div className="co-pilot-validation-checklist__actions">
          {data.autoResume ? (
            <Button
              type="button"
              size="sm"
              disabled={isBusy}
              onClick={() => onRetry?.(data.idempotencyKey!)}
            >
              {isBusy ? "Checking…" : data.primaryActionLabel}
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isBusy}
            onClick={() => onDiscard?.(data.idempotencyKey!)}
          >
            {data.cancelActionLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function ExecutionWidgetPanel({
  payload,
  busyKey,
  resolvedKeys,
  onConfirm,
  onDiscard,
}: {
  payload: CoPilotChatPayload;
  busyKey?: string | null;
  resolvedKeys?: ReadonlySet<string>;
  onConfirm?: (idempotencyKey: string) => void;
  onDiscard?: (idempotencyKey: string) => void;
}) {
  const widget = payload.executionWidget;
  if (!widget) {
    return null;
  }

  const isResolved =
    Boolean(widget.resolution) || (resolvedKeys?.has(widget.idempotencyKey) ?? false);
  const isBusy = busyKey === widget.idempotencyKey;
  const resolution = widget.resolution;
  const campaignHref =
    resolution?.campaignId != null
      ? AUTH_ROUTES.brandUceCampaignDetail.replace(":id", resolution.campaignId)
      : null;

  return (
    <div className="co-pilot-hitl-widget">
      <dl className="co-pilot-hitl-widget__fields">
        {Object.entries(widget.prefilledFields).map(([key, value]) => (
          <div key={key} className="co-pilot-hitl-widget__field">
            <dt>{formatPrefillLabel(key)}</dt>
            <dd>{formatPrefillValue(value)}</dd>
          </div>
        ))}
      </dl>
      {!isResolved ? (
        <div className="co-pilot-hitl-widget__actions">
          <Button
            type="button"
            size="sm"
            disabled={isBusy}
            onClick={() => onConfirm?.(widget.idempotencyKey)}
          >
            {isBusy ? "Working…" : widget.primaryActionLabel}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isBusy}
            onClick={() => onDiscard?.(widget.idempotencyKey)}
          >
            {widget.cancelActionLabel}
          </Button>
        </div>
      ) : null}
      {resolution ? (
        <div
          className={`co-pilot-hitl-widget__outcome co-pilot-hitl-widget__outcome--${resolution.status.toLowerCase()}`}
        >
          <Alert
            tone={resolution.status === "CONFIRMED" ? "success" : "warning"}
            title={
              resolution.status === "CONFIRMED" ? "Action saved" : "Action discarded"
            }
          >
            {resolution.summary ??
              (resolution.status === "CONFIRMED"
                ? "Your staged change was saved."
                : "Staged action discarded.")}
            {campaignHref ? (
              <p className="co-pilot-hitl-widget__link-wrap">
                <Link className="co-pilot-hitl-widget__link" to={campaignHref}>
                  View campaign
                </Link>
              </p>
            ) : null}
          </Alert>
        </div>
      ) : isResolved ? (
        <p className="co-pilot-hitl-widget__resolved">Action completed.</p>
      ) : null}
    </div>
  );
}

export function GenerativeUIPayloadRenderer({
  payload,
  hitlBusyKey,
  resolvedHitlKeys,
  onConfirmHitl,
  onDiscardHitl,
  onSubmitSlotValues,
  slotSubmitBusy,
}: Props) {
  return (
    <Card compact className="co-pilot-agent-card">
      <p className="co-pilot-agent-card__narrative">{payload.narrativeText}</p>

      {payload.formatType === "METRIC_HIGHLIGHT_GRID" && payload.metricGridData && (
        <MetricHighlightGrid metrics={payload.metricGridData} />
      )}

      {payload.tableData && <AuditEntityCards table={payload.tableData} />}

      {payload.formatType === "SLOT_FILLING_CLARIFICATION" && (
        <SlotFillingForm
          payload={payload}
          busy={slotSubmitBusy}
          onSubmit={onSubmitSlotValues}
        />
      )}

      {payload.formatType === "INTERACTIVE_EXECUTION_WIDGET" && (
        <ExecutionWidgetPanel
          payload={payload}
          busyKey={hitlBusyKey}
          resolvedKeys={resolvedHitlKeys}
          onConfirm={onConfirmHitl}
          onDiscard={onDiscardHitl}
        />
      )}

      {payload.validationChecklistData ? (
        <ValidationChecklistPanel
          data={payload.validationChecklistData}
          busyKey={hitlBusyKey}
          onRetry={onConfirmHitl}
          onDiscard={onDiscardHitl}
        />
      ) : null}
    </Card>
  );
}
