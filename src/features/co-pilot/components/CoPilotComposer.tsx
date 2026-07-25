import type { FormEvent } from "react";

import { Button } from "../../../design-system/aurora";

type Props = {
  value: string;
  placeholder: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
  /**
   * `home` — Stitch Integrated / Bottom Sheet bar (attach + send icon).
   * Used on Brand + Creator Home assistants.
   */
  variant?: "default" | "home";
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

export function CoPilotComposer({
  value,
  placeholder,
  disabled = false,
  onChange,
  onSubmit,
  variant = "default",
}: Props) {
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit();
  };

  const canSend = !disabled && Boolean(value.trim());

  if (variant === "home") {
    return (
      <form
        className="co-pilot-composer co-pilot-composer--home"
        onSubmit={handleSubmit}
      >
        <textarea
          className="co-pilot-composer__input"
          value={value}
          placeholder={placeholder}
          rows={1}
          disabled={disabled}
          aria-label={placeholder}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              onSubmit();
            }
          }}
        />
        <button
          type="submit"
          className="co-pilot-composer__icon-btn co-pilot-composer__icon-btn--send"
          aria-label="Send message"
          disabled={!canSend}
        >
          <SendIcon />
        </button>
      </form>
    );
  }

  return (
    <form className="co-pilot-composer" onSubmit={handleSubmit}>
      <textarea
        className="co-pilot-composer__input"
        value={value}
        placeholder={placeholder}
        rows={1}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            onSubmit();
          }
        }}
      />
      <Button
        type="submit"
        variant={canSend ? "primary" : "disabled"}
        size="sm"
        disabled={!canSend}
      >
        Send
      </Button>
    </form>
  );
}
