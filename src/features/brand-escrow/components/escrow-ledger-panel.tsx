import type { EscrowLedgerEntry } from "../types";
import { displayCurrency, displayText, EMPTY_DISPLAY } from "../utils/display-value";

type EscrowLedgerPanelProps = {
  entries: EscrowLedgerEntry[];
};

function formatLedgerDate(iso: string | undefined): string {
  if (!iso?.trim()) {
    return EMPTY_DISPLAY;
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return EMPTY_DISPLAY;
  }
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function EscrowLedgerPanel({ entries }: EscrowLedgerPanelProps) {
  const rows = entries.length > 0 ? entries : [null];

  return (
    <section className="brand-escrow-ledger" aria-label="Financial ledger">
      <div className="brand-escrow-ledger__header">
        <h3
          style={{
            margin: 0,
            fontFamily: "var(--font-heading)",
            fontSize: "var(--size-h2)",
            fontWeight: 700,
          }}
        >
          Financial Ledger
        </h3>
      </div>
      <ul className="brand-escrow-ledger__list">
        {rows.map((entry, index) => (
          <li
            key={entry?.id ?? `empty-${index}`}
            className="brand-escrow-ledger__item"
          >
            <div style={{ minWidth: 0 }}>
              <p
                style={{
                  margin: 0,
                  fontFamily: "var(--font-heading)",
                  fontSize: "var(--size-body)",
                  fontWeight: 700,
                }}
              >
                {entry ? displayText(entry.label) : EMPTY_DISPLAY}
              </p>
              <p
                style={{
                  margin: "0.25rem 0 0",
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--size-caption)",
                  color: "var(--text-muted)",
                }}
              >
                {entry ? formatLedgerDate(entry.occurredAt) : EMPTY_DISPLAY}
                {entry?.status ? ` · ${entry.status}` : ""}
              </p>
            </div>
            <p
              style={{
                margin: 0,
                fontFamily: "var(--font-heading)",
                fontSize: "var(--size-body)",
                fontWeight: 700,
                color:
                  entry?.direction === "credit" ? "#006c4b" : "var(--text-high)",
              }}
            >
              {entry
                ? `${entry.direction === "credit" ? "+" : "-"}${displayCurrency(entry.amount, entry.currency)}`
                : EMPTY_DISPLAY}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
