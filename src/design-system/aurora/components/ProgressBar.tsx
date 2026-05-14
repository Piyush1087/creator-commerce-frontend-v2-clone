type ProgressBarProps = {
  label: string;
  value: number;
};

export function ProgressBar({ label, value }: ProgressBarProps) {
  const normalizedValue = Math.min(100, Math.max(0, value));

  return (
    <div className="aurora-progress">
      <div className="aurora-progress__meta">
        <span>{label}</span>
        <strong>{normalizedValue}%</strong>
      </div>
      <div className="aurora-progress__track">
        <div
          className="aurora-progress__bar"
          style={{ width: `${normalizedValue}%` }}
        />
      </div>
    </div>
  );
}
