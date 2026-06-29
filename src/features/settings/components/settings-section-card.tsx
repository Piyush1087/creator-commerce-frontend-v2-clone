import type { PropsWithChildren, ReactNode } from "react";

type SettingsSectionCardProps = PropsWithChildren<{
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}>;

export function SettingsSectionCard({
  title,
  description,
  action,
  className = "",
  children,
}: SettingsSectionCardProps) {
  return (
    <section className={`settings-card ${className}`.trim()}>
      <div className="settings-card__header">
        <div>
          <h2 className="settings-card__title">{title}</h2>
          <p className="settings-card__description">{description}</p>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
