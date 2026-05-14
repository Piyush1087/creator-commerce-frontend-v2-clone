import type { ButtonHTMLAttributes, ReactNode } from "react";

export type AuroraButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "disabled";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: AuroraButtonVariant;
  fullWidthOnMobile?: boolean;
};

export function Button({
  children,
  className = "",
  fullWidthOnMobile = false,
  variant = "primary",
  ...props
}: ButtonProps) {
  const classes = [
    "aurora-button",
    `aurora-button--${variant}`,
    fullWidthOnMobile ? "aurora-button--form-action" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={classes} disabled={variant === "disabled"} {...props}>
      {children}
    </button>
  );
}
