import type { ReactNode } from "react";

type SelectionCardProps = {
  description?: string;
  icon: ReactNode;
  selected?: boolean;
  title: string;
  onClick?: () => void;
};

export function SelectionCard({
  description,
  icon,
  selected = false,
  title,
  onClick,
}: SelectionCardProps) {
  return (
    <button
      className={
        selected
          ? "aurora-selection-card aurora-selection-card--selected"
          : "aurora-selection-card"
      }
      type="button"
      onClick={onClick}
    >
      <span>
        <span className="aurora-selection-card__icon">{icon}</span>
        <span className="aurora-selection-card__title">{title}</span>
        {description && (
          <span className="aurora-selection-card__description">
            {description}
          </span>
        )}
      </span>
      <span aria-hidden="true" className="aurora-selection-card__indicator" />
    </button>
  );
}
