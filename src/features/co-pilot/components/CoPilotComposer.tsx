import type { FormEvent } from "react";

import { Button } from "../../../design-system/aurora";

type Props = {
  value: string;
  placeholder: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
};

export function CoPilotComposer({
  value,
  placeholder,
  disabled = false,
  onChange,
  onSubmit,
}: Props) {
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit();
  };

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
        variant={disabled || !value.trim() ? "disabled" : "primary"}
        size="sm"
        disabled={disabled || !value.trim()}
      >
        Send
      </Button>
    </form>
  );
}
