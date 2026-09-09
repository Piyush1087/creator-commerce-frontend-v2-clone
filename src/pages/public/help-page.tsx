import { Alert, Card } from "../../design-system/aurora";

export function HelpPage() {
  return (
    <div
      className="dashboard-content"
      style={{ maxWidth: 640, margin: "0 auto" }}
    >
      <Alert title="Help is a placeholder" tone="warning">
        Formal support documentation is not part of this freeze. This page
        exists so Brand Support and Creator Help have a mounted destination.
      </Alert>
      <Card
        className="bob-auth-card"
        style={{ marginTop: 24 }}
        eyebrow="Support"
        title="Help"
      >
        <p className="bob-muted" style={{ margin: 0 }}>
          Use Campaigns, Collaborations, and Settings for accepted product
          work. Contact your workspace administrator if you need assistance.
        </p>
      </Card>
    </div>
  );
}
