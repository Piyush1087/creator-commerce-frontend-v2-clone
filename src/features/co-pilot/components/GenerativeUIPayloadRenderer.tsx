import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import type { BadgeTone } from "../../../design-system/aurora";
import { Alert, Button, Card, SelectField, TextField } from "../../../design-system/aurora";
import { AUTH_ROUTES } from "../../../features/auth/constants";
import type {
  CoPilotChatPayload,
  DataTableData,
  MetricItem,
  SlotField,
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

function MetricHighlightGrid({ metrics }: { metrics: MetricItem[] }) {
  return (
    <div className="co-pilot-metric-grid">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className={`co-pilot-metric-grid__item co-pilot-metric-grid__item--${metric.statusColor.toLowerCase()}`}
        >
          <span className="co-pilot-metric-grid__label">{metric.label}</span>
          <strong className="co-pilot-metric-grid__value">{metric.value}</strong>
        </div>
      ))}
    </div>
  );
}

function AuditDataTable({ table }: { table: DataTableData }) {
  return (
    <div className="co-pilot-audit-table-wrap">
      <table className="co-pilot-audit-table">
        <thead>
          <tr>
            {table.headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, index) => (
            <tr key={index}>
              {table.headers.map((header) => (
                <td key={header}>{String(row[header] ?? "")}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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
    const options = (field.selectOptions ?? []).map((option) => ({
      value: option,
      label: formatSelectOptionLabel(option),
    }));
    return (
      <SelectField
        label={field.uiLabel}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        options={[{ value: "", label: field.placeholderText }, ...options]}
      />
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
            variant="outline"
            size="sm"
            disabled={isBusy}
            onClick={() => onDiscard?.(widget.idempotencyKey)}
          >
            {widget.cancelActionLabel}
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={isBusy}
            onClick={() => onConfirm?.(widget.idempotencyKey)}
          >
            {isBusy ? "Working…" : widget.primaryActionLabel}
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
                  View draft campaign
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

      {payload.tableData && <AuditDataTable table={payload.tableData} />}

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
    </Card>
  );
}
