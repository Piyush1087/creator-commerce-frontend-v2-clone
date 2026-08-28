import { createElement, type ReactNode } from "react";
import {
  authorityCopy,
  type BrandNode,
} from "../../adapters/brand-field-state";

const absentCopy = {
  EXPLICIT_NULL:
    "Creator Shop doesn’t have enough grounded information to state this yet.",
  NOT_ESTABLISHED: "Not established yet",
  NOT_EVALUATED: "Not evaluated yet",
  LEARNING: "Creator Shop is still learning this area.",
  TEMPORARILY_UNAVAILABLE: "This information is temporarily unavailable.",
};

export function BrandField({
  node,
  level = 3,
  valueHeading = false,
  children,
}: {
  node: BrandNode;
  level?: number;
  valueHeading?: boolean;
  children?: ReactNode;
}) {
  if (node.presentation === "OMITTED" || node.presentation === "NOT_OWNED")
    return null;
  const field = node.field;
  const cue = field ? authorityCopy[field.authority] : null;
  const candidate = field?.candidate;
  const hasCurrent = field?.current.kind === "VALUE";
  const headingId = `brand-field-${node.id}`;
  return (
    <div
      className="brand-workspace-field"
      data-semantic-id={node.id}
      data-current-kind={field?.current.kind}
      data-presentation={node.presentation}
      data-candidate-status={candidate?.status}
    >
      {node.label && !(valueHeading && node.text)
        ? createElement(
            level <= 6 ? `h${level}` : "p",
            { id: headingId, className: "brand-workspace-field__label" },
            node.label,
          )
        : null}
      {node.image ? (
        <img
          src={node.image}
          alt={node.text ?? node.label}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      ) : null}
      {node.text
        ? createElement(
            valueHeading ? `h${Math.min(level, 6)}` : "p",
            { className: "brand-workspace-field__value" },
            <>
              {node.href ? (
                <a href={node.href} target="_blank" rel="noopener noreferrer">
                  {node.text}
                </a>
              ) : (
                node.text
              )}
            </>,
          )
        : null}
      {hasCurrent && cue ? (
        <p className="brand-workspace-field__meta">{cue}</p>
      ) : null}
      {hasCurrent && field.freshness === "STALE" ? (
        <p className="brand-workspace-field__meta">May need updating</p>
      ) : null}
      {candidate?.status === "CONFLICT" ? (
        <p className="brand-workspace-field__notice">
          {field?.authority === "confirmed"
            ? "New information differs from your confirmed Brand information. Your confirmed value remains unchanged."
            : "New information differs from your current Brand information."}
        </p>
      ) : candidate?.status === "AVAILABLE" ? (
        <p className="brand-workspace-field__notice">
          Creator Shop found something new to review.
        </p>
      ) : null}
      {node.presentation === "EMPTY" ? (
        <p className="brand-workspace-field__meta">
          {node.emptyText ?? "No current items."}
        </p>
      ) : null}
      {node.presentation in absentCopy ? (
        <p className="brand-workspace-field__meta">
          {absentCopy[node.presentation as keyof typeof absentCopy]}
        </p>
      ) : null}
      {children ??
        (node.children?.length ? (
          <div className="brand-workspace-field__children">
            {node.children.map((child) => (
              <BrandField
                key={child.id}
                node={child}
                level={node.label ? level + 1 : level}
              />
            ))}
          </div>
        ) : null)}
      {node.note ? (
        <p className="brand-workspace-field__meta">{node.note}</p>
      ) : null}
    </div>
  );
}
