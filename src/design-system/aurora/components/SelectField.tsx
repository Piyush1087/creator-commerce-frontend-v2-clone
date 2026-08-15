import type { SelectHTMLAttributes } from "react";

export type SelectOption = {
  label: string;
  value: string;
};

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  helperText?: string;
  label: string;
  options: SelectOption[];
};

export function SelectField({
  helperText,
  label,
  options,
  ...props
}: SelectFieldProps) {
  return (
    <label className="aurora-field">
      <span className="aurora-field__label">{label}</span>
      <select aria-label={label} className="aurora-select" {...props}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {helperText && <span className="aurora-field__helper">{helperText}</span>}
    </label>
  );
}
