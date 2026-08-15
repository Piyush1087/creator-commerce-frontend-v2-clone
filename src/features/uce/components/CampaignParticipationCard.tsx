import { useCallback, useEffect, useState } from "react";

import { Alert, Button, Card } from "../../../design-system/aurora";
import {
  decideCampaignApplication,
  fetchCampaignApplications,
  fetchCampaignDiscovery,
} from "../api/brand-uce-client";
import type {
  CampaignApplicationProjection,
  CampaignDiscoveryProjection,
} from "../contracts/brand-uce.contracts";

type Props = { campaignId: string };

export function CampaignParticipationCard({ campaignId }: Props) {
  const [discovery, setDiscovery] = useState<CampaignDiscoveryProjection | null>(null);
  const [applications, setApplications] = useState<CampaignApplicationProjection[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(
    () =>
      Promise.all([fetchCampaignDiscovery(campaignId), fetchCampaignApplications(campaignId)])
      .then(([nextDiscovery, nextApplications]) => {
        setDiscovery(nextDiscovery);
        setApplications(nextApplications);
      })
      .catch((cause: unknown) =>
        setError(cause instanceof Error ? cause.message : "Participation details could not be loaded."),
      ),
    [campaignId],
  );

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Card eyebrow="Participation" title="Discovery & applications">
      {discovery ? <Alert tone="warning" title="Recommendations unavailable">{discovery.message}</Alert> : null}
      {applications.length === 0 ? <p>No applications have been received yet.</p> : null}
      {applications.map((application) => (
        <article key={application.application_id}>
          <strong>{application.creator.name ?? application.creator.email}</strong>
          <p>{application.brief.title} · {application.status}</p>
          {application.collaboration_reference ? (
            <p>Collaboration reference: {application.collaboration_reference.collaboration_id}</p>
          ) : null}
          {application.status === "SUBMITTED" ? (
            <div>
              <Button
                type="button"
                disabled={savingId === application.application_id}
                onClick={() => {
                  setSavingId(application.application_id);
                  void decideCampaignApplication(campaignId, application.application_id, "accept")
                    .then(load)
                    .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Application could not be accepted."))
                    .finally(() => setSavingId(null));
                }}
              >
                Accept application
              </Button>
              <Button
                type="button"
                disabled={savingId === application.application_id}
                onClick={() => {
                  setSavingId(application.application_id);
                  void decideCampaignApplication(campaignId, application.application_id, "reject")
                    .then(load)
                    .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Application could not be declined."))
                    .finally(() => setSavingId(null));
                }}
              >
                Decline application
              </Button>
            </div>
          ) : null}
        </article>
      ))}
      {error ? <Alert tone="error" title="Could not update participation">{error}</Alert> : null}
    </Card>
  );
}
