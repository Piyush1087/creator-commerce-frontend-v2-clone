import { useState, type FormEvent } from "react";
import { Button, TextField } from "../../../../design-system/aurora";

export function RevisionRequestForm({ revisionNumber, busy, onSubmit }: { revisionNumber: number; busy: boolean; onSubmit: (feedback: string) => void }) {
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState<string>();
  const submit = (event: FormEvent) => { event.preventDefault(); const value = feedback.trim(); if (value.length < 3) { setError("Describe what needs to change."); return; } setError(undefined); onSubmit(value); };
  return <form className="collab-command-form" onSubmit={submit} aria-busy={busy}><h6>Request revision</h6><p>Revision {revisionNumber} of 2{revisionNumber === 2 ? " · Final revision" : ""}</p><TextField label="Describe what needs to change" value={feedback} onChange={(event) => { setFeedback(event.target.value); setError(undefined); }} error={error} disabled={busy} multiline /><Button type="submit" disabled={busy} fullWidthOnMobile>{busy ? "Requesting…" : "Request revision"}</Button></form>;
}
