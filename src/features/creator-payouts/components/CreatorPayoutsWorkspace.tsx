import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  Clock3,
  RefreshCw,
  WalletCards,
} from "lucide-react";
import { Link } from "react-router-dom";

import { Alert, Badge, Button } from "../../../design-system/aurora";
import { SideDrawer } from "../../../design-system/aurora/components/SideDrawer";
import {
  fetchCreatorPayoutHistoryDetail,
  fetchCreatorPayoutObligation,
  fetchCreatorPayoutsHistory,
  fetchCreatorPayoutsObligations,
} from "../api/creator-payouts-client";
import type {
  CreatorPayoutHistory,
  CreatorPayoutObligation,
} from "../contracts/creator-payouts.contracts";
import { useCreatorPayouts } from "../hooks/use-creator-payouts";
import "../creator-payouts.css";

type Selection =
  | { kind: "obligation"; item: CreatorPayoutObligation }
  | { kind: "history"; item: CreatorPayoutHistory };
const familyLabels = {
  UPCOMING: "Upcoming",
  DUE_OR_ACTION_REQUIRED: "Due or action required",
  PROCESSING: "Processing",
  PAID_TO_DATE: "Paid to date",
} as const;
const familyIcons = {
  UPCOMING: CalendarClock,
  DUE_OR_ACTION_REQUIRED: AlertCircle,
  PROCESSING: Clock3,
  PAID_TO_DATE: CheckCircle2,
} as const;

export function CreatorPayoutsWorkspace() {
  const resources = useCreatorPayouts();
  const { overview, obligations, history, method, accessDenied, refresh } =
    resources;
  const [tab, setTab] = useState<"obligations" | "history">("obligations");
  const [moreObligations, setMoreObligations] = useState<
    CreatorPayoutObligation[]
  >([]);
  const [moreHistory, setMoreHistory] = useState<CreatorPayoutHistory[]>([]);
  const [obligationCursor, setObligationCursor] = useState<string | null>(null);
  const [historyCursor, setHistoryCursor] = useState<string | null>(null);
  const [paging, setPaging] = useState(false);
  const [pagingError, setPagingError] = useState<string | null>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const detailRequestId = useRef(0);

  useEffect(() => {
    setMoreObligations([]);
    setObligationCursor(obligations.data?.page.next_cursor ?? null);
  }, [obligations.data]);
  useEffect(() => {
    setMoreHistory([]);
    setHistoryCursor(history.data?.page.next_cursor ?? null);
  }, [history.data]);

  if (accessDenied)
    return (
      <main className="cp-workspace">
        <header>
          <h1>Creator payouts</h1>
        </header>
        <Alert tone="warning" title="Payout workspace unavailable">
          Your current Creator role does not permit access to payout
          information.
        </Alert>
      </main>
    );
  const initialLoading = [overview, obligations, history, method].some(
    (resource) => resource.status === "INITIAL_LOADING",
  );
  const refreshing = [overview, obligations, history, method].some(
    (resource) => resource.status === "REFRESHING",
  );
  const errors = [
    overview.error,
    obligations.error,
    history.error,
    method.error,
  ].filter((value): value is string => Boolean(value));
  const obligationRows = [
    ...(obligations.data?.items ?? []),
    ...moreObligations,
  ];
  const historyRows = [...(history.data?.items ?? []), ...moreHistory];

  async function loadMore() {
    setPaging(true);
    setPagingError(null);
    try {
      if (tab === "obligations" && obligationCursor) {
        const next = await fetchCreatorPayoutsObligations(obligationCursor);
        if (next.as_of !== obligations.data?.as_of)
          throw new Error("The payout snapshot changed. Refresh to continue.");
        setMoreObligations((rows) => [...rows, ...next.items]);
        setObligationCursor(next.page.next_cursor);
      }
      if (tab === "history" && historyCursor) {
        const next = await fetchCreatorPayoutsHistory(historyCursor);
        if (next.as_of !== history.data?.as_of)
          throw new Error("The payout snapshot changed. Refresh to continue.");
        setMoreHistory((rows) => [...rows, ...next.items]);
        setHistoryCursor(next.page.next_cursor);
      }
    } catch {
      setPagingError("The next page is unavailable. Refresh and try again.");
    } finally {
      setPaging(false);
    }
  }

  async function openDetail(value: Selection) {
    const requestId = ++detailRequestId.current;
    setSelection(value);
    setDetailLoading(true);
    setDetailError(null);
    try {
      if (value.kind === "obligation") {
        const response = await fetchCreatorPayoutObligation(
          value.item.public_reference,
        );
        if (detailRequestId.current !== requestId) return;
        setSelection({ kind: "obligation", item: response.obligation });
      } else {
        const response = await fetchCreatorPayoutHistoryDetail(
          value.item.public_reference,
        );
        if (detailRequestId.current !== requestId) return;
        setSelection({ kind: "history", item: response.history });
      }
    } catch {
      if (detailRequestId.current !== requestId) return;
      setDetailError(
        "This payout record is unavailable for your current access.",
      );
    } finally {
      if (detailRequestId.current === requestId) setDetailLoading(false);
    }
  }

  function closeDetail() {
    detailRequestId.current += 1;
    setSelection(null);
    setDetailLoading(false);
  }

  return (
    <main className="cp-workspace" aria-busy={initialLoading || refreshing}>
      <header className="cp-header">
        <div>
          <p className="cp-eyebrow">Creator workspace</p>
          <h1>Creator payouts</h1>
          <p>
            Read-only payout truth from your Collaboration agreements and the
            shared financial engine.
          </p>
        </div>
        <Button variant="ghost" onClick={refresh} disabled={refreshing}>
          <RefreshCw size={16} aria-hidden />{" "}
          {refreshing ? "Refreshing" : "Refresh"}
        </Button>
      </header>
      <p className="cp-sr-status" role="status" aria-live="polite">
        {initialLoading
          ? "Loading payout information."
          : refreshing
            ? "Refreshing payout information."
            : errors.length
              ? "Some payout information is unavailable."
              : "Payout information loaded."}
      </p>
      {errors.length ? (
        <Alert tone="warning" title="Some payout information is unavailable">
          Available sections remain visible. Refresh to try the unavailable
          sections again.
        </Alert>
      ) : null}

      <SummaryGrid
        loading={initialLoading}
        summaries={overview.data?.summaries ?? []}
        coverage={overview.data?.section.coverage}
      />
      <MethodCard
        value={method.data?.payout_method ?? null}
        loading={method.status === "INITIAL_LOADING"}
      />

      <section className="cp-panel" aria-labelledby="cp-activity-title">
        <div className="cp-panel-heading">
          <div>
            <h2 id="cp-activity-title">Payout records</h2>
            <p>
              Amounts and dates appear only when canonical lineage is proven.
            </p>
          </div>
          <div className="cp-tabs" role="tablist" aria-label="Payout records">
            <button
              type="button"
              role="tab"
              aria-selected={tab === "obligations"}
              onClick={() => setTab("obligations")}
            >
              Obligations
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "history"}
              onClick={() => setTab("history")}
            >
              History
            </button>
          </div>
        </div>
        {tab === "obligations" ? (
          <Obligations
            rows={obligationRows}
            loading={obligations.status === "INITIAL_LOADING"}
            coverage={obligations.data?.section.coverage}
            onSelect={(item) => void openDetail({ kind: "obligation", item })}
          />
        ) : (
          <History
            rows={historyRows}
            loading={history.status === "INITIAL_LOADING"}
            onSelect={(item) => void openDetail({ kind: "history", item })}
          />
        )}
        {pagingError ? (
          <Alert tone="warning" title="Could not load the next page">
            {pagingError}
          </Alert>
        ) : null}
        {(tab === "obligations" ? obligationCursor : historyCursor) ? (
          <Button
            variant="ghost"
            onClick={() => void loadMore()}
            disabled={paging}
          >
            {paging ? "Loading more…" : "Load more"}
          </Button>
        ) : null}
      </section>

      <SideDrawer
        isOpen={selection !== null}
        onClose={closeDetail}
        title={
          selection?.kind === "obligation"
            ? "Obligation detail"
            : "History detail"
        }
        subtitle="Creator-safe payout record"
      >
        {detailLoading ? (
          <p role="status">Loading detail…</p>
        ) : detailError ? (
          <Alert tone="warning" title="Detail unavailable">
            {detailError}
          </Alert>
        ) : selection ? (
          <Detail selection={selection} />
        ) : null}
      </SideDrawer>
    </main>
  );
}

function SummaryGrid({
  loading,
  summaries,
  coverage,
}: {
  loading: boolean;
  summaries: {
    family: keyof typeof familyLabels;
    value: { amount: string; currency: string };
  }[];
  coverage?: string;
}) {
  const currencies = [...new Set(summaries.map((item) => item.value.currency))];
  if (loading)
    return (
      <section className="cp-summary" aria-label="Payout summary">
        <article className="cp-card cp-skeleton">Loading summary…</article>
      </section>
    );
  if (currencies.length === 0)
    return (
      <section className="cp-empty" aria-label="Payout summary">
        <WalletCards aria-hidden />
        <h2>No canonical payout totals yet</h2>
        <p>
          Totals will appear when an obligation has complete financial lineage.
        </p>
      </section>
    );
  return (
    <section aria-label="Payout summary" className="cp-summary-groups">
      {coverage === "PARTIAL" ? (
        <p className="cp-limited">
          Some unproven records are excluded from totals.
        </p>
      ) : null}
      {currencies.map((currency) => (
        <div key={currency}>
          <h2>{currency} summary</h2>
          <div className="cp-summary">
            {Object.entries(familyLabels).map(([family, label]) => {
              const value = summaries.find(
                (item) =>
                  item.family === family && item.value.currency === currency,
              )?.value ?? { amount: "0.0000", currency };
              const Icon = familyIcons[family as keyof typeof familyIcons];
              return (
                <article className="cp-card" key={family}>
                  <Icon aria-hidden />
                  <p>{label}</p>
                  <strong>{formatMoney(value)}</strong>
                </article>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}

function MethodCard({
  value,
  loading,
}: {
  value: {
    status: string;
    masked_display: string | null;
    destination_type: string | null;
    country_code: string | null;
    currency_code: string | null;
    safe_reason_code: string | null;
    manage_settings_href: string | null;
  } | null;
  loading: boolean;
}) {
  return (
    <section className="cp-card cp-method" aria-labelledby="cp-method-title">
      <div>
        <h2 id="cp-method-title">Payout method</h2>
        {loading ? (
          <p>Loading payout method…</p>
        ) : value ? (
          <>
            <p>
              <Badge tone={value.status === "CURRENT" ? "success" : "pending"}>
                {readable(value.status)}
              </Badge>
            </p>
            <p>{value.masked_display ?? "No displayable payout destination"}</p>
            <p className="cp-muted">
              {[value.destination_type, value.country_code, value.currency_code]
                .filter((part): part is string => Boolean(part))
                .map(readable)
                .join(" · ") ||
                readable(value.safe_reason_code ?? value.status)}
            </p>
          </>
        ) : (
          <p>Payout method unavailable.</p>
        )}
      </div>
      {value?.manage_settings_href ? (
        <Link className="cp-link" to={value.manage_settings_href}>
          Manage in Settings
        </Link>
      ) : null}
    </section>
  );
}

function Obligations({
  rows,
  loading,
  coverage,
  onSelect,
}: {
  rows: CreatorPayoutObligation[];
  loading: boolean;
  coverage?: string;
  onSelect: (item: CreatorPayoutObligation) => void;
}) {
  if (loading) return <p role="status">Loading obligations…</p>;
  if (!rows.length)
    return (
      <div className="cp-empty">
        <h3>No payout obligations</h3>
        <p>There are no payout obligations available for this workspace.</p>
      </div>
    );
  return (
    <>
      {coverage === "PARTIAL" ? (
        <p className="cp-limited">
          Limited rows with unproven money or dates are labeled and excluded
          from totals.
        </p>
      ) : null}
      <div className="cp-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Record</th>
              <th>Status</th>
              <th>Due</th>
              <th>Outstanding</th>
              <th>
                <span className="cp-visually-hidden">Open</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.obligation_id}>
                <td>
                  {shortRef(item.public_reference)}
                  {item.legacy ? (
                    <span className="cp-legacy">Limited</span>
                  ) : null}
                </td>
                <td>
                  <Badge tone={tone(item.lifecycle)}>
                    {readable(item.lifecycle)}
                  </Badge>
                  <small>{readable(item.effective_gate)}</small>
                </td>
                <td>{formatDate(item.payment_due_at)}</td>
                <td>{formatMoney(item.outstanding_value)}</td>
                <td>
                  <button
                    className="cp-row-action"
                    type="button"
                    onClick={() => onSelect(item)}
                    aria-label={`View ${shortRef(item.public_reference)}`}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="cp-mobile-list">
        {rows.map((item) => (
          <button
            type="button"
            className="cp-mobile-row"
            key={item.obligation_id}
            onClick={() => onSelect(item)}
          >
            <span>
              <strong>{formatMoney(item.outstanding_value)}</strong>
              <small>{shortRef(item.public_reference)}</small>
            </span>
            <span>
              <Badge tone={tone(item.lifecycle)}>
                {readable(item.lifecycle)}
              </Badge>
              <small>{formatDate(item.payment_due_at)}</small>
            </span>
          </button>
        ))}
      </div>
    </>
  );
}

function History({
  rows,
  loading,
  onSelect,
}: {
  rows: CreatorPayoutHistory[];
  loading: boolean;
  onSelect: (item: CreatorPayoutHistory) => void;
}) {
  if (loading) return <p role="status">Loading payout history…</p>;
  if (!rows.length)
    return (
      <div className="cp-empty">
        <h3>No payout history</h3>
        <p>Recorded payout activity will appear here.</p>
      </div>
    );
  return (
    <div className="cp-history">
      {rows.map((item) => (
        <button
          type="button"
          key={item.history_id}
          className="cp-history-row"
          onClick={() => onSelect(item)}
        >
          <span>
            <strong>{readable(item.event_type)}</strong>
            <small>{formatDate(item.recorded_at)}</small>
          </span>
          <span>
            <strong>{formatMoney(item.value)}</strong>
            <small>{readable(item.status)}</small>
          </span>
        </button>
      ))}
    </div>
  );
}

function Detail({ selection }: { selection: Selection }) {
  const entries =
    selection.kind === "obligation"
      ? [
          ["Record", selection.item.public_reference],
          ["Lifecycle", readable(selection.item.lifecycle)],
          ["Gate", readable(selection.item.effective_gate)],
          ["Entitlement", formatMoney(selection.item.entitlement_value)],
          ["Settled", formatMoney(selection.item.settled_value)],
          ["Outstanding", formatMoney(selection.item.outstanding_value)],
          ["Payment due", formatDate(selection.item.payment_due_at)],
          [
            "Payment term",
            readable(selection.item.payment_term ?? "Unavailable"),
          ],
          ["Collaboration", selection.item.collaboration_reference],
        ]
      : [
          ["Event", readable(selection.item.event_type)],
          ["Value", formatMoney(selection.item.value)],
          ["Status", readable(selection.item.status)],
          ["Recorded", formatDate(selection.item.recorded_at)],
          ["Obligation", selection.item.obligation_reference],
          ["Collaboration", selection.item.collaboration_reference],
        ];
  return (
    <dl className="cp-detail">
      {entries.map(([term, value]) => (
        <div key={term}>
          <dt>{term}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function formatMoney(
  value: { amount: string; currency: string } | null,
): string {
  if (!value) return "Unavailable";
  const [whole, fraction] = value.amount.split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/gu, ",");
  return `${value.currency} ${grouped}${fraction ? `.${fraction}` : ""}`;
}
function formatDate(value: string | null): string {
  if (!value) return "Unavailable";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}
function readable(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
function shortRef(value: string): string {
  return value.length <= 28 ? value : `${value.slice(0, 24)}…`;
}
function tone(value: string): "success" | "pending" | "error" | "neutral" {
  return value === "SETTLED"
    ? "success"
    : value.includes("ACTION") ||
        value.includes("FAILED") ||
        value.includes("LEGACY")
      ? "error"
      : value.includes("PROCESS") ||
          value.includes("SCHEDULED") ||
          value.includes("READY")
        ? "pending"
        : "neutral";
}
