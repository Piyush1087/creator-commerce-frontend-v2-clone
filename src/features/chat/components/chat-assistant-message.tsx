import { Badge } from "../../../design-system/aurora";
import type { ChatGroundedResponse } from "../contracts/chat.schemas";

const STATUS_COPY: Record<
  ChatGroundedResponse["status"],
  { label: string; tone: "success" | "pending" | "error" | "neutral" }
> = {
  ANSWERED: { label: "Answered", tone: "success" },
  PARTIAL: { label: "Partial information", tone: "pending" },
  STALE: { label: "Freshness notice", tone: "pending" },
  CAPABILITY_UNAVAILABLE: {
    label: "Temporarily unavailable",
    tone: "pending",
  },
  NOT_AUTHORIZED: { label: "Not available", tone: "neutral" },
  NAVIGATION: { label: "Opening destination", tone: "success" },
};

function NoticeList({
  title,
  items,
  tone,
}: {
  title: string;
  items: readonly string[];
  tone: "warning" | "neutral";
}) {
  if (items.length === 0) return null;
  return (
    <div
      className={`chat-response__notice chat-response__notice--${tone}`}
      role="status"
    >
      <strong>{title}</strong>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export function ChatAssistantMessage({
  response,
}: {
  response: ChatGroundedResponse;
}) {
  const status = STATUS_COPY[response.status];
  const sourceLabels = [
    ...new Set(
      response.grounding.map((grounding) =>
        grounding.sourceType === "CANONICAL"
          ? "Creator Shop records"
          : "Creator Shop Intelligence",
      ),
    ),
  ];

  return (
    <article className="chat-response" data-chat-status={response.status}>
      <div className="chat-response__status">
        <Badge tone={status.tone}>{status.label}</Badge>
      </div>
      <p className="chat-response__answer">{response.answer}</p>

      <NoticeList
        title="Information freshness"
        items={response.freshnessNotes}
        tone="warning"
      />
      <NoticeList
        title="What Creator Shop could confirm"
        items={response.limitations}
        tone={response.status === "PARTIAL" ? "warning" : "neutral"}
      />

      {response.recommendation ? (
        <div className="chat-response__recommendation">
          <strong>Suggestion</strong>
          <p>{response.recommendation.text}</p>
        </div>
      ) : null}

      {sourceLabels.length > 0 ? (
        <div className="chat-response__sources" aria-label="Answer sources">
          <span>Based on</span>
          {sourceLabels.map((label) => (
            <Badge key={label} tone="neutral">
              {label}
            </Badge>
          ))}
        </div>
      ) : null}
    </article>
  );
}
