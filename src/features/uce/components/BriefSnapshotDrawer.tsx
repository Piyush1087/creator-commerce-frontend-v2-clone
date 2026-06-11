import { SideDrawer } from "../../../design-system/aurora/components/SideDrawer";
import { Button } from "../../../design-system/aurora/components/Button";
import type { RepositoryBrief } from "../types/repository";
import { displayField, EMPTY_FIELD } from "../utils/display-field";
import { formatUceDateTime } from "../utils/uce-format";
import "./BriefSnapshotDrawer.css";

type BriefSnapshotDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  brief: RepositoryBrief | null;
};

export function BriefSnapshotDrawer({
  isOpen,
  onClose,
  brief,
}: BriefSnapshotDrawerProps) {
  const title = brief
    ? `Strategic Brief: ${brief.name}`
    : `Strategic Brief: ${EMPTY_FIELD}`;

  return (
    <SideDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      width="560px"
      footer={
        <div className="uce-drawer-footer-stack">
          <Button variant="outline" className="uce-drawer-footer-full" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      {brief ? (
        <div className="uce-brief-snapshot">
          <section className="uce-brief-snapshot__section">
            <p className="uce-brief-snapshot__label">Internal title</p>
            <p className="uce-brief-snapshot__title">{displayField(brief.name)}</p>
          </section>

          <section className="uce-brief-snapshot__section">
            <p className="uce-brief-snapshot__label">Deliverable formats</p>
            {brief.formatTags.length > 0 ? (
              <div className="uce-brief-snapshot__chips">
                {brief.formatTags.map((tag) => (
                  <span key={tag} className="uce-brief-snapshot__chip uce-brief-snapshot__chip--format">
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <p className="uce-brief-snapshot__value">{displayField(brief.formatType)}</p>
            )}
          </section>

          <section className="uce-brief-snapshot__section">
            <p className="uce-brief-snapshot__label">Required platforms</p>
            {brief.platforms.length > 0 ? (
              <div className="uce-brief-snapshot__chips">
                {brief.platforms.map((platform) => (
                  <span
                    key={platform}
                    className="uce-brief-snapshot__chip uce-brief-snapshot__chip--platform"
                  >
                    {platform}
                  </span>
                ))}
              </div>
            ) : (
              <p className="uce-brief-snapshot__value">{EMPTY_FIELD}</p>
            )}
          </section>

          <section className="uce-brief-snapshot__section">
            <p className="uce-brief-snapshot__label">Creative guidelines</p>
            <div className="uce-brief-snapshot__guidelines">
              {brief.creativeGuidelines.trim().length > 0
                ? brief.creativeGuidelines
                : EMPTY_FIELD}
            </div>
          </section>

          <section className="uce-brief-snapshot__section uce-brief-snapshot__meta">
            <div>
              <p className="uce-brief-snapshot__label">Brief ID</p>
              <p className="uce-brief-snapshot__mono">{brief.id}</p>
            </div>
            <div>
              <p className="uce-brief-snapshot__label">Created</p>
              <p className="uce-brief-snapshot__value">
                {brief.createdAt ? formatUceDateTime(brief.createdAt) : EMPTY_FIELD}
              </p>
            </div>
          </section>
        </div>
      ) : (
        <p className="uce-brief-snapshot__empty">No brief selected.</p>
      )}
    </SideDrawer>
  );
}
