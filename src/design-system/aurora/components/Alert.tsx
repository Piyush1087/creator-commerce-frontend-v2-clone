import type { PropsWithChildren } from "react";

type AlertTone = "success" | "warning" | "error";

type AlertProps = PropsWithChildren<{
  title: string;
  tone?: AlertTone;
}>;

const toneIcon: Record<AlertTone, string> = {
  success: "OK",
  warning: "!",
  error: "!",
};

export function Alert({ children, title, tone = "success" }: AlertProps) {
  return (
    <div className={`aurora-alert aurora-alert--${tone}`}>
      <span className="aurora-alert__icon">{toneIcon[tone]}</span>
      <div>
        <p className="aurora-alert__title">{title}</p>
        <p className="aurora-alert__body">{children}</p>
      </div>
    </div>
  );
}
