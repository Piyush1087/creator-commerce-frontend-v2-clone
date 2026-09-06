import type { FormEvent } from "react";

type ChatComposerProps = {
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
};

function SendIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

export function ChatComposer({
  value,
  disabled,
  onChange,
  onSubmit,
}: ChatComposerProps) {
  const canSend = !disabled && value.trim().length > 0;
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (canSend) onSubmit();
  };

  return (
    <form className="chat-composer" onSubmit={handleSubmit}>
      <textarea
        className="chat-composer__input"
        value={value}
        rows={1}
        maxLength={8_000}
        placeholder="Ask Creator Shop about your Brand, Products, or Campaigns"
        aria-label="Message Ask Creator Shop"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            if (canSend) onSubmit();
          }
        }}
      />
      <button
        type="submit"
        className="chat-composer__send"
        aria-label="Send message"
        disabled={!canSend}
      >
        <SendIcon />
      </button>
    </form>
  );
}
