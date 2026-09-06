import { useEffect, useState } from "react";
import { Alert, Button, TextField } from "../../../../design-system/aurora";
import { fetchCreatorDefaultContact } from "../../../settings/api/creator-profile-contact-client";
import type { CreatorDefaultContact } from "../../../settings/contracts/creator-profile-contact.contracts";
import type { CollaborationDestinationOverride } from "../../api/collaboration-client";
import type { CollaborationDetailResponse } from "../../contracts/collaboration.contracts";
import { collaborationCapabilities } from "../../utils/collaboration-capabilities";

type Props = {
  detail: CollaborationDetailResponse;
  busy: boolean;
  onConfirmDefault: (contact: CreatorDefaultContact) => void;
  onOverride: (value: CollaborationDestinationOverride) => void;
};

export function PhysicalDestinationPanel({
  detail,
  busy,
  onConfirmDefault,
  onOverride,
}: Props) {
  const capabilities = collaborationCapabilities(detail);
  const canConfirm = capabilities.has("confirm-default-destination");
  const canOverride = capabilities.has("override-destination");
  const [contact, setContact] = useState<CreatorDefaultContact | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    recipientName: "",
    addressLine1: "",
    city: "",
    postalCode: "",
    countryCode: "IN",
  });

  useEffect(() => {
    if (!canConfirm) return;
    let active = true;
    setLoading(true);
    fetchCreatorDefaultContact()
      .then((response) => {
        if (active) setContact(response.default_contact);
      })
      .catch((cause: unknown) => {
        if (active)
          setError(
            cause instanceof Error
              ? cause.message
              : "Default destination could not be loaded.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [detail.identity.collaborationId, canConfirm]);

  if (!detail.physicalDestination?.required) return null;
  if (detail.physicalDestination.confirmed) {
    return (
      <section
        className="collab-exec-card"
        aria-labelledby="collab-destination-title"
      >
        <h4 id="collab-destination-title">Physical destination</h4>
        <Alert tone="success" title="Destination confirmed">
          This Collaboration's immutable delivery destination is confirmed.
          Address details remain private.
        </Alert>
      </section>
    );
  }
  if (!canConfirm && !canOverride) return null;

  const submitOverride = () => {
    if (
      !form.recipientName.trim() ||
      !form.addressLine1.trim() ||
      !form.city.trim() ||
      !form.postalCode.trim() ||
      form.countryCode.trim().length !== 2
    ) {
      setError("Complete the required destination fields.");
      return;
    }
    setError(null);
    onOverride({ ...form, countryCode: form.countryCode.trim().toUpperCase() });
  };

  return (
    <section
      className="collab-exec-card"
      aria-labelledby="collab-destination-title"
    >
      <h4 id="collab-destination-title">Confirm physical destination</h4>
      <p>
        Confirm the Creator Settings default or use a one-Collaboration
        override. It cannot be changed after confirmation.
      </p>
      {error ? (
        <Alert tone="error" title="Destination unavailable">
          {error}
        </Alert>
      ) : null}
      {loading ? <p role="status">Loading saved destination…</p> : null}
      {contact ? (
        <div className="collab-command-form">
          <address>
            {contact.recipient_name}
            <br />
            {contact.address_line_1}
            <br />
            {contact.city} {contact.postal_code}
            <br />
            {contact.country_code}
          </address>
          <Button
            disabled={busy}
            onClick={() => onConfirmDefault(contact)}
            fullWidthOnMobile
          >
            {busy ? "Confirming…" : "Confirm saved destination"}
          </Button>
        </div>
      ) : null}
      {canOverride ? (
        <Button
          variant="secondary"
          disabled={busy}
          onClick={() => setEditing((value) => !value)}
          fullWidthOnMobile
        >
          {editing ? "Cancel override" : "Use an override"}
        </Button>
      ) : null}
      {editing ? (
        <div className="collab-command-form">
          <TextField
            label="Recipient name"
            value={form.recipientName}
            onChange={(event) =>
              setForm((value) => ({
                ...value,
                recipientName: event.target.value,
              }))
            }
          />
          <TextField
            label="Address line 1"
            value={form.addressLine1}
            onChange={(event) =>
              setForm((value) => ({
                ...value,
                addressLine1: event.target.value,
              }))
            }
          />
          <TextField
            label="City"
            value={form.city}
            onChange={(event) =>
              setForm((value) => ({ ...value, city: event.target.value }))
            }
          />
          <TextField
            label="Postal code"
            value={form.postalCode}
            onChange={(event) =>
              setForm((value) => ({ ...value, postalCode: event.target.value }))
            }
          />
          <TextField
            label="Country code"
            value={form.countryCode}
            maxLength={2}
            onChange={(event) =>
              setForm((value) => ({
                ...value,
                countryCode: event.target.value,
              }))
            }
          />
          <Button disabled={busy} onClick={submitOverride} fullWidthOnMobile>
            {busy ? "Confirming…" : "Confirm override"}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
