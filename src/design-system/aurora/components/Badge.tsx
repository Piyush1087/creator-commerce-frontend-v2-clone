import type { HTMLAttributes, PropsWithChildren } from "react";

export type BadgeTone = "success" | "selected" | "pending" | "error" | "neutral";

type BadgeProps = PropsWithChildren<{
  tone?: BadgeTone;
  className?: string;
  style?: HTMLAttributes<HTMLElement>["style"];
  onClick?: () => void;
  disabled?: boolean;
}>;

export function Badge({ children, tone = "success", className = "", style, onClick }: BadgeProps) {
  return (
    <span 
      className={`aurora-badge aurora-badge--${tone} ${className}`} 
      style={style} 
      onClick={onClick}
    >
      {children}
    </span>
  );
}

export function Chip({
  children,
  tone = "success",
  className = "",
  style,
  onClick,
  disabled = false,
}: BadgeProps) {
  return (
    <button 
      className={`aurora-chip aurora-chip--${tone} ${className}`} 
      type="button" 
      style={style}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
