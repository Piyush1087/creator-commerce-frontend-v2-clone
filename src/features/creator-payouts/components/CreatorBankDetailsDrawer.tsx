import { useState } from "react";

import { Button, TextField } from "../../../design-system/aurora";
import { SideDrawer } from "../../../design-system/aurora/components/SideDrawer";
import { upsertCreatorPayoutBank } from "../../settings/api/creator-settings-client";

type CreatorBankDetailsDrawerProps = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  mode?: "add" | "edit" | "fix";
};

export function CreatorBankDetailsDrawer({
  open,
  onClose,
  onSaved,
  mode = "add",
}: CreatorBankDetailsDrawerProps) {
  const [accountHolder, setAccountHolder] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [confirmAccountNumber, setConfirmAccountNumber] = useState("");
  const [ifscOrRouting, setIfscOrRouting] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const title =
    mode === "fix"
      ? "Fix payout details"
      : mode === "edit"
        ? "Update bank account"
        : "Add bank details";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (accountNumber.trim() !== confirmAccountNumber.trim()) {
      setError("Account number and confirmation must match.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      // Settings/Payout is the canonical bank writer (creates settlement profile).
      await upsertCreatorPayoutBank({
        beneficiaryLegalName: accountHolder.trim(),
        accountNumber: accountNumber.trim(),
        confirmAccountNumber: confirmAccountNumber.trim(),
        routingIfscSwift: ifscOrRouting.trim().toUpperCase(),
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save bank details.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SideDrawer isOpen={open} onClose={onClose} title={title}>
      <form onSubmit={(event) => void handleSubmit(event)} style={{ display: "grid", gap: 16 }}>
        {error ? <p className="cc-muted" role="alert">{error}</p> : null}
        <TextField
          label="Account holder name"
          value={accountHolder}
          onChange={(e) => setAccountHolder(e.target.value)}
          required
        />
        <TextField
          label="Account number"
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value)}
          required
        />
        <TextField
          label="Confirm account number"
          value={confirmAccountNumber}
          onChange={(e) => setConfirmAccountNumber(e.target.value)}
          required
        />
        <TextField
          label="IFSC / routing code"
          value={ifscOrRouting}
          onChange={(e) => setIfscOrRouting(e.target.value)}
          required
        />
        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : "Save bank details"}
        </Button>
      </form>
    </SideDrawer>
  );
}
