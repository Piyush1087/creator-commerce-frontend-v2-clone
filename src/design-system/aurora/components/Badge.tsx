import type { HTMLAttributes, PropsWithChildren } from "react";

export type BadgeTone = "success" | "selected" | "pending" | "error" | "neutral";

type BadgeProps = PropsWithChildren<{
  tone?: BadgeTone;
  className?: string;
  style?: HTMLAttributes<HTMLElement>["style"];
  onClick?: () => void;
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

export function Chip({ children, tone = "success", className = "", style, onClick }: BadgeProps) {
  return (
    <button 
      className={`aurora-chip aurora-chip--${tone} ${className}`} 
      type="button" 
      style={style}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
