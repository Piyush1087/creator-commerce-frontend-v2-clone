import type { ReactNode } from "react";

export type WorkspaceStateKind =
  | "loading"
  | "empty"
  | "unavailable"
  | "error"
  | "compatibility"
  | "reference";

export function WorkspaceStatePanel({
  kind,
  title,
  children,
  action,
}: {
  kind: WorkspaceStateKind;
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section
      className={`canonical-workspace-state canonical-workspace-state--${kind}`}
      role={kind === "error" ? "alert" : "status"}
    >
      <div>
        <h3>{title}</h3>
        <div className="canonical-workspace-state__body">{children}</div>
      </div>
      {action ? (
        <div className="canonical-workspace-state__action">{action}</div>
      ) : null}
    </section>
  );
}
