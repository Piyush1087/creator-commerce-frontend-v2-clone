import { useState } from "react";
import { Button, TextField } from "../../../../design-system/aurora";
export function RevisionRequestForm({ revisionNumber, busy, onSubmit }: { revisionNumber: number; busy: boolean; onSubmit: (feedback: string) => void }) {
  const [feedback, setFeedback] = useState("");
  return <div><p>Revision {revisionNumber} of 2{revisionNumber === 2 ? " · Final revision" : ""}</p><TextField label="Describe what needs to change" value={feedback} onChange={(event) => setFeedback(event.target.value)} /><Button disabled={busy || feedback.trim().length < 3} onClick={() => onSubmit(feedback.trim())}>Request revision</Button></div>;
}
