import { forwardRef } from "react";
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
  size?: "sm" | "md" | "lg";
  fullWidthOnMobile?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      children,
      className = "",
      fullWidthOnMobile = false,
      variant = "primary",
      size = "md",
      ...props
    },
    ref,
  ) {
    const classes = [
      "aurora-button",
      `aurora-button--${variant}`,
      `aurora-button--${size}`,
      fullWidthOnMobile ? "aurora-button--form-action" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button
        ref={ref}
        className={classes}
        disabled={variant === "disabled"}
        {...props}
      >
        {children}
      </button>
    );
  },
);
