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

type Props = {
  campaignId: string;
  workspace: "discovery" | "applications" | "collaborations";
};

export function CampaignParticipationCard({ campaignId, workspace }: Props) {
  const [discovery, setDiscovery] = useState<CampaignDiscoveryProjection | null>(null);
  const [applications, setApplications] = useState<CampaignApplicationProjection[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    () => {
      setLoading(true);
      setError(null);
      return Promise.all([fetchCampaignDiscovery(campaignId), fetchCampaignApplications(campaignId)])
      .then(([nextDiscovery, nextApplications]) => {
        setDiscovery(nextDiscovery);
        setApplications(nextApplications);
      })
      .catch((cause: unknown) =>
        setError(cause instanceof Error ? cause.message : "Participation details could not be loaded."),
      )
      .finally(() => setLoading(false));
    },
    [campaignId],
  );

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Card eyebrow="Campaign workspace" title={workspace}>
      {loading ? <p>Loading workspace…</p> : null}
      {error ? (
        <Alert tone="error" title="Could not load workspace">
          {error} <Button type="button" onClick={() => void load()}>Retry</Button>
        </Alert>
      ) : null}
      {!loading && !error && workspace === "discovery" && discovery ? (
        <Alert tone="warning" title="Recommendations unavailable">{discovery.message}</Alert>
      ) : null}
      {!loading && !error && workspace === "applications" && applications.length === 0 ? <p>No applications have been received yet.</p> : null}
      {!loading && !error && workspace === "applications" ? applications.map((application) => (
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
      )) : null}
      {!loading && !error && workspace === "collaborations" ? (
        applications.some((application) => application.collaboration_reference) ? (
          <ul>
            {applications.filter((application) => application.collaboration_reference).map((application) => (
              <li key={application.application_id}>
                {application.creator.name ?? application.creator.email} · Collaboration reference {application.collaboration_reference?.collaboration_id}
              </li>
            ))}
          </ul>
        ) : <p>No Collaborations are linked to this Campaign yet.</p>
      ) : null}
    </Card>
  );
}
