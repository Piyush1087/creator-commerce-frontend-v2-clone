import type { PropsWithChildren } from "react";

export type BadgeTone = "success" | "selected" | "pending" | "error";

type BadgeProps = PropsWithChildren<{
  tone?: BadgeTone;
}>;

export function Badge({ children, tone = "success" }: BadgeProps) {
  return <span className={`aurora-badge aurora-badge--${tone}`}>{children}</span>;
}

export function Chip({ children, tone = "success" }: BadgeProps) {
  return (
    <button className={`aurora-chip aurora-chip--${tone}`} type="button">
      {children}
    </button>
  );
}
