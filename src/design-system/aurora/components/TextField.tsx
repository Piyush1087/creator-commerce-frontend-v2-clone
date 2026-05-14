import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

type BaseFieldProps = {
  error?: string;
  helperText?: string;
  label: string;
};

type TextFieldProps = BaseFieldProps &
  InputHTMLAttributes<HTMLInputElement> & {
    multiline?: false;
  };

type TextareaFieldProps = BaseFieldProps &
  TextareaHTMLAttributes<HTMLTextAreaElement> & {
    multiline: true;
  };

export function TextField(props: TextFieldProps | TextareaFieldProps) {
  const { error, helperText, label, multiline, ...controlProps } = props;
  const controlClass = [
    "aurora-field__control",
    multiline ? "aurora-field__control--textarea" : "",
    error ? "aurora-field__control--error" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <label className="aurora-field">
      <span className="aurora-field__label">{label}</span>
      {multiline ? (
        <textarea
          className={controlClass}
          {...(controlProps as TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : (
        <input
          className={controlClass}
          {...(controlProps as InputHTMLAttributes<HTMLInputElement>)}
        />
      )}
      {(error || helperText) && (
        <span
          className={
            error
              ? "aurora-field__helper aurora-field__helper--error"
              : "aurora-field__helper"
          }
        >
          {error || helperText}
        </span>
      )}
    </label>
  );
}
