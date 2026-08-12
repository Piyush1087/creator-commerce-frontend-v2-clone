import { Alert, Badge, Button, SideDrawer } from "../../../design-system/aurora";
import type { CreatorProfileView } from "./types";

export function CreatorProfileDrawer({
  profile,
  loading,
  error,
  isOpen,
  onClose,
}: {
  profile?: CreatorProfileView;
  loading: boolean;
  error?: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <SideDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Creator Profile"
      subtitle={profile?.name ?? "Campaign creator"}
      footer={<Button onClick={onClose}>Done</Button>}
    >
      {loading ? <p>Loading creator profile…</p> : null}
      {error ? (
        <Alert title="Creator profile unavailable" tone="warning">
          {error}
        </Alert>
      ) : null}
      {!loading && !error && profile ? (
        <div className="canonical-campaign-drawer__stack">
          <div className="canonical-campaign-drawer__badges">
            <Badge>{profile.platform}</Badge>
            <Badge tone="neutral">{profile.source}</Badge>
            <Badge tone="neutral">{profile.reviewState}</Badge>
          </div>
          <dl className="canonical-campaign-drawer__details">
            <div><dt>Creator</dt><dd>{profile.name}</dd></div>
            <div><dt>Email</dt><dd>{profile.email ?? "No email on file"}</dd></div>
          </dl>
          <section>
            <h3 className="canonical-campaign-drawer__section-title">Campaign applications</h3>
            {profile.applications.length === 0 ? (
              <p className="canonical-campaign-page__empty">No Campaign applications.</p>
            ) : (
              <div className="canonical-campaign-drawer__list">
                {profile.applications.map((application) => (
                  <article className="canonical-campaign-drawer__list-item" key={application.applicationId}>
                    <div className="canonical-campaign-drawer__badges">
                      <Badge tone="neutral">{application.status}</Badge>
                      <Badge tone="neutral">{application.source}</Badge>
                    </div>
                    <p>{new Date(application.appliedAt).toLocaleString()}</p>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : null}
    </SideDrawer>
  );
}
