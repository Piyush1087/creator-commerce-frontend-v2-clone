import { useEffect, useMemo, useState } from "react";

import { Alert, Button } from "../../../../design-system/aurora";
import type {
  BrandNotificationSettingLine,
  NotificationCategory,
  NotificationChannel,
} from "../../contracts/brand-settings.contracts";
import { settingsDisplayText } from "../../utils/brand-settings-display";
import { SettingsSectionCard } from "../settings-section-card";

const CATEGORY_ORDER: NotificationCategory[] = [
  "ESCROW_LOW_BALANCE",
  "MILESTONE_RELEASE_REQUEST",
  "TAX_COMPLIANCE_ALERT",
  "CAMPAIGN_BUDGET_OVERRUN",
];

const CATEGORY_LABELS: Record<NotificationCategory, string> = {
  ESCROW_LOW_BALANCE: "Escrow low balance",
  MILESTONE_RELEASE_REQUEST: "Milestone release request",
  TAX_COMPLIANCE_ALERT: "Tax compliance alert",
  CAMPAIGN_BUDGET_OVERRUN: "Campaign budget overrun",
};

const CHANNELS: NotificationChannel[] = ["IN_APP", "EMAIL", "SLACK_WEBHOOK"];

type MatrixRow = {
  category: NotificationCategory;
  inApp: boolean;
  email: boolean;
  slack: boolean;
  slackWebhookUrl: string;
};

function matrixKey(category: NotificationCategory, channel: NotificationChannel): string {
  return `${category}:${channel}`;
}

function buildMatrix(settings: BrandNotificationSettingLine[]): MatrixRow[] {
  const lookup = new Map<string, BrandNotificationSettingLine>();
  for (const line of settings) {
    lookup.set(matrixKey(line.category, line.channel), line);
  }

  return CATEGORY_ORDER.map((category) => {
    const inApp = lookup.get(matrixKey(category, "IN_APP"))?.is_enabled ?? false;
    const email = lookup.get(matrixKey(category, "EMAIL"))?.is_enabled ?? false;
    const slackLine = lookup.get(matrixKey(category, "SLACK_WEBHOOK"));
    return {
      category,
      inApp,
      email,
      slack: slackLine?.is_enabled ?? false,
      slackWebhookUrl: slackLine?.slack_webhook_url ?? "",
    };
  });
}

function matrixToPayload(rows: MatrixRow[]) {
  const settings: Array<{
    category: NotificationCategory;
    channel: NotificationChannel;
    isEnabled: boolean;
    slackWebhookUrl?: string | null;
  }> = [];

  for (const row of rows) {
    for (const channel of CHANNELS) {
      const isEnabled =
        channel === "IN_APP"
          ? row.inApp
          : channel === "EMAIL"
            ? row.email
            : row.slack;
      settings.push({
        category: row.category,
        channel,
        isEnabled,
        slackWebhookUrl: channel === "SLACK_WEBHOOK" ? row.slackWebhookUrl || null : null,
      });
    }
  }

  return { settings };
}

type BrandNotificationsSectionProps = {
  settings: BrandNotificationSettingLine[] | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  readOnly?: boolean;
  onSave: (payload: ReturnType<typeof matrixToPayload>) => Promise<void>;
};

export function BrandNotificationsSection({
  settings,
  loading,
  saving,
  error,
  readOnly = false,
  onSave,
}: BrandNotificationsSectionProps) {
  const [rows, setRows] = useState<MatrixRow[]>([]);
  const [dirty, setDirty] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const baseline = useMemo(
    () => (settings ? buildMatrix(settings) : []),
    [settings],
  );

  useEffect(() => {
    setRows(baseline);
    setDirty(false);
  }, [baseline]);

  const updateRow = (category: NotificationCategory, patch: Partial<MatrixRow>) => {
    setRows((current) =>
      current.map((row) => (row.category === category ? { ...row, ...patch } : row)),
    );
    setDirty(true);
  };

  const handleSave = async () => {
    for (const row of rows) {
      if (row.slack && !row.slackWebhookUrl.trim()) {
        setFormError(
          `A target webhook URL is required when Slack is enabled for ${CATEGORY_LABELS[row.category]}.`,
        );
        return;
      }
    }
    setFormError(null);
    try {
      await onSave(matrixToPayload(rows));
      setDirty(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save notification settings.");
    }
  };

  return (
    <SettingsSectionCard
      title="System alerts & target webhook channel profiles"
      description="Configure operational alerting pathways across in-app, email, and Slack webhook channels."
    >
      {error ? (
        <Alert tone="error" title="Notification settings unavailable">
          {error}
        </Alert>
      ) : null}
      {formError ? (
        <Alert tone="error" title="Validation error">
          {formError}
        </Alert>
      ) : null}
      {loading && !settings ? (
        <p className="cc-muted">Loading notification matrix…</p>
      ) : (
        <>
          <div className="settings-team__table-wrap">
            <table className="settings-team__table settings-notifications__table">
              <thead>
                <tr>
                  <th>Alert category</th>
                  <th>In-app</th>
                  <th>Email</th>
                  <th>Slack</th>
                  <th>Slack webhook target URL</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.category}>
                    <td>{CATEGORY_LABELS[row.category]}</td>
                    <td>
                      <input
                        type="checkbox"
                        checked={row.inApp}
                        disabled={readOnly}
                        onChange={(e) => updateRow(row.category, { inApp: e.target.checked })}
                      />
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={row.email}
                        disabled={readOnly}
                        onChange={(e) => updateRow(row.category, { email: e.target.checked })}
                      />
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={row.slack}
                        disabled={readOnly}
                        onChange={(e) => updateRow(row.category, { slack: e.target.checked })}
                      />
                    </td>
                    <td>
                      {row.slack ? (
                        <input
                          type="url"
                          className="settings-notifications__url-input"
                          aria-label={`Slack webhook URL for ${CATEGORY_LABELS[row.category]}`}
                          value={row.slackWebhookUrl}
                          disabled={readOnly}
                          placeholder={settingsDisplayText(null)}
                          onChange={(e) =>
                            updateRow(row.category, { slackWebhookUrl: e.target.value })
                          }
                        />
                      ) : (
                        settingsDisplayText(null)
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="settings-section-card__actions">
            <Button
              variant="primary"
              disabled={!dirty || saving || readOnly}
              onClick={() => void handleSave()}
            >
              {saving ? "Saving…" : "Save notification settings"}
            </Button>
          </div>
        </>
      )}
    </SettingsSectionCard>
  );
}
