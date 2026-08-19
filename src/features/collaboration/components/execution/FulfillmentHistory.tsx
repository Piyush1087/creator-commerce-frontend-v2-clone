import type { CollaborationDetailResponse } from "../../contracts/collaboration.contracts";

type Fulfillment = NonNullable<CollaborationDetailResponse["fulfillment"]>;

function formatTimestamp(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}

export function FulfillmentHistory({
  fulfillment,
  supportLabel,
}: {
  fulfillment: Fulfillment;
  supportLabel: string;
}) {
  const events: Array<{ label: string; at: string }> = [];
  const { evidence, confirmation } = fulfillment;

  if (evidence.brandFulfilledAt) {
    events.push({
      label: `${supportLabel} details provided`,
      at: evidence.brandFulfilledAt,
    });
  }
  if (confirmation.creatorConfirmedAt) {
    events.push({
      label: "Creator confirmed fulfillment",
      at: confirmation.creatorConfirmedAt,
    });
  }
  if (confirmation.completedAt) {
    events.push({
      label: "Fulfillment completed",
      at: confirmation.completedAt,
    });
  }
  if (confirmation.hardStoppedAt) {
    events.push({
      label: "Fulfillment stopped",
      at: confirmation.hardStoppedAt,
    });
  }
  fulfillment.issues.forEach((issue) => {
    events.push({
      label: `Issue ${issue.sequence} reported`,
      at: issue.reportedAt,
    });
    if (issue.remediationAt) {
      events.push({
        label: `Issue ${issue.sequence} remediation provided`,
        at: issue.remediationAt,
      });
    }
  });

  if (!events.length) return null;
  events.sort((left, right) => Date.parse(right.at) - Date.parse(left.at));

  return (
    <section
      className="collab-fulfillment-history"
      aria-labelledby="collab-fulfillment-history-title"
    >
      <h5 id="collab-fulfillment-history-title">Fulfillment history</h5>
      <ol>
        {events.map((event) => (
          <li key={`${event.label}-${event.at}`}>
            <span aria-hidden="true" />
            <div>
              <strong>{event.label}</strong>
              <time dateTime={event.at}>{formatTimestamp(event.at)}</time>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
