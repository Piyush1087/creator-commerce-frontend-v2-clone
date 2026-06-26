import { useState } from "react";

import { Button, TextField } from "../../../design-system/aurora";
import { SideDrawer } from "../../../design-system/aurora/components/SideDrawer";
import { upsertCreatorBankDetails } from "../../collaboration/api/collaboration-client";

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
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
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
    setBusy(true);
    setError(null);
    try {
      await upsertCreatorBankDetails({
        account_holder: accountHolder.trim(),
        bank_name: bankName.trim(),
        account_number: accountNumber.trim(),
        ifsc_or_routing: ifscOrRouting.trim(),
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
          label="Bank name"
          value={bankName}
          onChange={(e) => setBankName(e.target.value)}
          required
        />
        <TextField
          label="Account number"
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value)}
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
