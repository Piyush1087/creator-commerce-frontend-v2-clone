import { Alert, Badge, Button, TextField } from "../../../design-system/aurora";
import { SideDrawer } from "../../../design-system/aurora/components/SideDrawer";
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
      isOpen={isOpen}
      onClose={onClose}
      title="Outreach"
      subtitle="Prepare creator outreach"
      footer={
        <div className="canonical-campaign-drawer__footer-actions">
          <Button onClick={onClose} variant="outline">Close</Button>
          <Button disabled title="Execution endpoint is not available yet">Send</Button>
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
          <div className="canonical-campaign-drawer__badges">
            <Badge>{composer.channel}</Badge>
          </div>
          <Alert title="Execution boundary pending" tone="info">
            The Campaign backend can prepare this composer, but the canonical final Email/Priority DM execution command is not implemented yet. The UI does not fabricate send or delivery state.
          </Alert>
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
        </div>
      ) : null}
    </SideDrawer>
  );
}
