import { Badge, Button } from "../../../design-system/aurora";

export type CreatorCardProps = {
  name: string;
  category: string;
  followers: string;
  engagement: string;
  avatarInitials: string;
  contextLabel?: string;
  applicationStatus?: string;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  tertiaryActionLabel?: string;
  onTertiaryAction?: () => void;
  busy?: boolean;
  variant?: "discovery" | "applicant";
  intelligenceStatus?: "PROCESSING" | "READY" | "UNAVAILABLE";
  intelligenceLabel?: string;
  compatibility?: boolean;
  terminal?: boolean;
};

/** Compact creator surface for Discovery / Applicants (Phase 3 ADD). */
export function CreatorCard({
  name,
  category,
  followers,
  engagement,
  avatarInitials,
  contextLabel,
  applicationStatus,
  primaryActionLabel,
  onPrimaryAction,
  secondaryActionLabel,
  onSecondaryAction,
  tertiaryActionLabel,
  onTertiaryAction,
  busy,
  variant = "discovery",
  intelligenceStatus,
  intelligenceLabel,
  compatibility = false,
  terminal = false,
}: CreatorCardProps) {
  return (
    <article
      className={`canonical-creator-card canonical-creator-card--${variant}${terminal ? " canonical-creator-card--terminal" : ""}`}
    >
      <div className="canonical-creator-card__identity">
        <span className="canonical-creator-card__avatar" aria-hidden>
          {avatarInitials}
        </span>
        <div>
          <strong>{name}</strong>
          {[category, followers, engagement].some(Boolean) ? (
            <p>
              {[category, followers, engagement].filter(Boolean).join(" · ")}
            </p>
          ) : null}
        </div>
        <div className="canonical-creator-card__badges">
          {contextLabel ? <Badge>{contextLabel}</Badge> : null}
          {applicationStatus ? <Badge>{applicationStatus}</Badge> : null}
        </div>
      </div>
      {intelligenceStatus ? (
        <div className="canonical-creator-card__intelligence">
          <span>Campaign intelligence</span>
          <strong>{intelligenceLabel ?? intelligenceStatus}</strong>
        </div>
      ) : null}
      {compatibility ? (
        <p className="canonical-creator-card__compatibility">
          Legacy compatibility references only; no canonical Campaign Asset or
          Brief lineage is inferred.
        </p>
      ) : null}
      <div className="canonical-creator-card__actions">
        {primaryActionLabel && onPrimaryAction ? (
          <Button disabled={busy} onClick={onPrimaryAction}>
            {primaryActionLabel}
          </Button>
        ) : null}
        {secondaryActionLabel && onSecondaryAction ? (
          <Button disabled={busy} onClick={onSecondaryAction} variant="outline">
            {secondaryActionLabel}
          </Button>
        ) : null}
        {tertiaryActionLabel && onTertiaryAction ? (
          <Button disabled={busy} onClick={onTertiaryAction} variant="ghost">
            {tertiaryActionLabel}
          </Button>
        ) : null}
      </div>
    </article>
  );
}
