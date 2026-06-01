import "./Toggle.css";

type ToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
};

export function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <label className="aurora-toggle">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="aurora-toggle__slider"></span>
      {label && <span className="aurora-toggle__label">{label}</span>}
    </label>
  );
}
