import { useState } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";

type Props = {
  messageId: string;
  threadId: string;
  disabled?: boolean;
  onSubmit: (args: {
    messageId: string;
    threadId: string;
    rating: "THUMBS_UP" | "THUMBS_DOWN";
    reason?: string;
  }) => Promise<void>;
};

export function CoPilotMessageFeedback({
  messageId,
  threadId,
  disabled,
  onSubmit,
}: Props) {
  const [submitted, setSubmitted] = useState<"THUMBS_UP" | "THUMBS_DOWN" | null>(
    null,
  );
  const [busy, setBusy] = useState(false);

  const submit = (rating: "THUMBS_UP" | "THUMBS_DOWN") => {
    if (disabled || busy || submitted) {
      return;
    }
    setBusy(true);
    void onSubmit({ messageId, threadId, rating })
      .then(() => setSubmitted(rating))
      .finally(() => setBusy(false));
  };

  return (
    <div className="co-pilot-feedback" aria-label="Rate this response">
      <button
        type="button"
        className={`co-pilot-feedback__icon-btn${
          submitted === "THUMBS_UP" ? " co-pilot-feedback__icon-btn--active" : ""
        }`}
        aria-label="Good response"
        aria-pressed={submitted === "THUMBS_UP"}
        disabled={disabled || busy || submitted !== null}
        onClick={() => submit("THUMBS_UP")}
      >
        <ThumbsUp size={15} strokeWidth={submitted === "THUMBS_UP" ? 2.5 : 2} />
      </button>
      <button
        type="button"
        className={`co-pilot-feedback__icon-btn${
          submitted === "THUMBS_DOWN" ? " co-pilot-feedback__icon-btn--active" : ""
        }`}
        aria-label="Bad response"
        aria-pressed={submitted === "THUMBS_DOWN"}
        disabled={disabled || busy || submitted !== null}
        onClick={() => submit("THUMBS_DOWN")}
      >
        <ThumbsDown
          size={15}
          strokeWidth={submitted === "THUMBS_DOWN" ? 2.5 : 2}
        />
      </button>
    </div>
  );
}
