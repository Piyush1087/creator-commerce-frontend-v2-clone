type SelectionCardProps = {
  description: string;
  icon: string;
  selected?: boolean;
  title: string;
};

export function SelectionCard({
  description,
  icon,
  selected = false,
  title,
}: SelectionCardProps) {
  return (
    <button
      className={
        selected
          ? "aurora-selection-card aurora-selection-card--selected"
          : "aurora-selection-card"
      }
      type="button"
    >
      <span>
        <span className="aurora-selection-card__icon">{icon}</span>
        <span className="aurora-selection-card__title">{title}</span>
        <span className="aurora-selection-card__description">
          {description}
        </span>
      </span>
      <span aria-hidden="true" className="aurora-selection-card__indicator" />
    </button>
  );
}
