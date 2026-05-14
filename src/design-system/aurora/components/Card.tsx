import type { PropsWithChildren, ReactNode } from "react";

type CardProps = PropsWithChildren<{
  action?: ReactNode;
  className?: string;
  compact?: boolean;
  eyebrow?: string;
  title?: string;
}>;

export function Card({
  action,
  children,
  className = "",
  compact = false,
  eyebrow,
  title,
}: CardProps) {
  const classes = [
    "aurora-card",
    compact ? "aurora-card--compact" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={classes}>
      {(eyebrow || title || action) && (
        <header className="aurora-card__header">
          <div>
            {eyebrow && <p className="aurora-card__eyebrow">{eyebrow}</p>}
            {title && <h2 className="aurora-card__title">{title}</h2>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}
