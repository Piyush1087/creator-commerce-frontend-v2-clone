import {
  Alert,
  Badge,
  Button,
  SideDrawer,
  TextField,
} from "../../../design-system/aurora";
import type { OutreachComposerView } from "./types";

export function OutreachComposerDrawer({
  composer,
  loading,
  error,
  isOpen,
  onClose,
  subject,
  body,
  onSubjectChange,
  onBodyChange,
}: {
  composer?: OutreachComposerView;
  loading: boolean;
  error?: string;
  isOpen: boolean;
  onClose: () => void;
  subject: string;
  body: string;
  onSubjectChange: (value: string) => void;
  onBodyChange: (value: string) => void;
}) {
  return (
    <SideDrawer
      closeLabel="Close Outreach drawer"
      isOpen={isOpen}
      onClose={onClose}
      title="Outreach"
      subtitle="Prepare creator outreach"
      footer={
        <div className="canonical-campaign-drawer__footer-actions">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
          <Button disabled title="Execution endpoint is not available yet">
            Send
          </Button>
        </div>
      }
    >
      {loading ? <p>Preparing outreach…</p> : null}
      {error ? (
        <Alert title="Outreach unavailable" tone="warning">
          {error}
        </Alert>
      ) : null}
      {!loading && !error && composer ? (
        <div className="canonical-campaign-drawer__stack">
          <div className="canonical-campaign-drawer__context">
            <span>Prepared outreach</span>
            <strong>Campaign creator message</strong>
            <div className="canonical-campaign-drawer__badges">
              <Badge>{composer.channel}</Badge>
            </div>
          </div>
          <Alert title="Execution boundary pending" tone="warning">
            The Campaign backend can prepare this composer, but the canonical
            final Email/Priority DM execution command is not implemented yet.
            The UI does not fabricate send or delivery state.
          </Alert>
          <section className="canonical-campaign-drawer__panel">
            <h3 className="canonical-campaign-drawer__section-title">
              Message preparation
            </h3>
            {composer.channel === "EMAIL" ? (
              <TextField
                label="Subject"
                value={subject}
                onChange={(event) => onSubjectChange(event.target.value)}
              />
            ) : null}
            <TextField
              label="Message"
              multiline
              rows={8}
              value={body}
              onChange={(event) => onBodyChange(event.target.value)}
            />
          </section>
        </div>
      ) : null}
    </SideDrawer>
  );
}
