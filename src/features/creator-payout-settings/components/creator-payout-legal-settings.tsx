import { useEffect, useState } from "react";
import { Landmark, Loader2, ShieldCheck } from "lucide-react";

import {
  Alert,
  Badge,
  Button,
  SideDrawer,
} from "../../../design-system/aurora";
import { SettingsSectionCard } from "../../settings/components/settings-section-card";
import type {
  CreatorLegalProfileWrite,
  CreatorPayoutDestinationState,
  CreatorPayoutDestinationWrite,
  CreatorPayoutSettingsResponse,
} from "../contracts/creator-payout-settings.contract";
import { useCreatorPayoutSettings } from "../hooks/use-creator-payout-settings";
import { CreatorLegalProfileDrawer } from "./creator-legal-profile-drawer";
import { CreatorPayoutDestinationDrawer } from "./creator-payout-destination-drawer";
import "../creator-payout-settings.css";

type CreatorPayoutLegalSettingsViewProps = {
  data: CreatorPayoutSettingsResponse;
  saving: boolean;
  error: string | null;
  onReplaceDestination: (input: CreatorPayoutDestinationWrite) => Promise<void>;
  onDisableDestination: (destinationId: string) => Promise<void>;
  onSaveLegalProfile: (input: CreatorLegalProfileWrite) => Promise<void>;
};

const methodLabels = {
  BANK_ACCOUNT: "Bank account",
  UPI: "UPI",
  PAYPAL: "PayPal",
} as const;

export function CreatorPayoutLegalSettings() {
  const {
    data,
    loading,
    saving,
    error,
    replaceDestination,
    disableDestination,
    saveLegalProfile,
  } = useCreatorPayoutSettings();

  if (loading && !data) {
    return (
      <div
        className="creator-payout-settings creator-payout-settings--loading"
        role="status"
      >
        <Loader2 aria-hidden size={24} />
        <span>Loading payout and legal settings…</span>
      </div>
    );
  }
  if (!data) {
    return (
      <Alert tone="error" title="Payout settings unavailable">
        {error ?? "Payout and legal settings could not be loaded."}
      </Alert>
    );
  }
  return (
    <CreatorPayoutLegalSettingsView
      data={data}
      saving={saving}
      error={error}
      onReplaceDestination={replaceDestination}
      onDisableDestination={disableDestination}
      onSaveLegalProfile={saveLegalProfile}
    />
  );
}

export function CreatorPayoutLegalSettingsView({
  data,
  saving,
  error,
  onReplaceDestination,
  onDisableDestination,
  onSaveLegalProfile,
}: CreatorPayoutLegalSettingsViewProps) {
  const [destinationOpen, setDestinationOpen] = useState(false);
  const [legalOpen, setLegalOpen] = useState(false);
  const [disableOpen, setDisableOpen] = useState(false);
  const [disableError, setDisableError] = useState<string | null>(null);
  const legal = data.legal_profile;
  const destination = data.destination;

  const anyDrawerOpen = destinationOpen || legalOpen || disableOpen;
  useEffect(() => {
    if (!anyDrawerOpen) return;
    document.body.classList.add("creator-payout-sheet-open");
    return () => document.body.classList.remove("creator-payout-sheet-open");
  }, [anyDrawerOpen]);

  if (!data.can_manage) {
    return (
      <Alert
        tone="warning"
        title="Payout settings are unavailable for this role"
      >
        Only the workspace Owner or Manager can access payout destinations and
        legal identity settings.
      </Alert>
    );
  }

  const disableDestination = async () => {
    if (!destination) return;
    setDisableError(null);
    try {
      await onDisableDestination(destination.destination_id);
      setDisableOpen(false);
    } catch {
      setDisableError("The payout destination could not be disabled.");
    }
  };

  return (
    <div className="creator-payout-settings">
      {error ? (
        <Alert tone="error" title="Payout settings action failed">
          {error}
        </Alert>
      ) : null}

      <Alert tone="warning" title="Configured does not mean verified">
        C-05 securely stores your selected destination. Identity checks,
        provider verification, and payout execution are not part of this MVP.
      </Alert>

      <SettingsSectionCard
        title="Payout destination"
        description="Choose the primary destination for future payouts. Replacing it requires complete secure re-entry."
        action={
          <Button
            type="button"
            variant="outline"
            fullWidthOnMobile
            disabled={!legal || saving}
            aria-describedby={
              !legal ? "creator-payout-legal-required" : undefined
            }
            onClick={() => setDestinationOpen(true)}
          >
            {destination ? "Replace destination" : "Add destination"}
          </Button>
        }
      >
        {!legal ? (
          <p
            id="creator-payout-legal-required"
            className="creator-payout-settings__notice"
          >
            Complete the legal profile before adding a payout destination.
          </p>
        ) : null}
        {destination ? (
          <div className="creator-payout-settings__summary">
            <span className="creator-payout-settings__icon" aria-hidden>
              <Landmark size={20} />
            </span>
            <div className="creator-payout-settings__summary-copy">
              <div className="creator-payout-settings__summary-heading">
                <strong>{methodLabels[destination.destination_type]}</strong>
                <DestinationStateBadge state={destination.state} />
              </div>
              <p>{destination.beneficiary_name}</p>
              <p className="creator-payout-settings__masked">
                {destination.masked_display}
              </p>
              <p className="creator-payout-settings__meta">
                {destination.country_code} · {destination.currency_code} ·
                version {destination.version}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              fullWidthOnMobile
              disabled={saving}
              onClick={() => {
                setDisableError(null);
                setDisableOpen(true);
              }}
            >
              Disable
            </Button>
          </div>
        ) : (
          <div className="creator-payout-settings__empty">
            <ShieldCheck aria-hidden size={24} />
            <p>No canonical payout destination is configured.</p>
          </div>
        )}
      </SettingsSectionCard>

      <SettingsSectionCard
        title="Legal profile"
        description="Maintain the minimum legal identity and address used by future payout readiness checks."
        action={
          <Button
            type="button"
            variant="outline"
            fullWidthOnMobile
            disabled={saving}
            onClick={() => setLegalOpen(true)}
          >
            {legal ? "Edit legal profile" : "Add legal profile"}
          </Button>
        }
      >
        {legal ? (
          <dl className="creator-payout-settings__legal-grid">
            <div>
              <dt>Legal name</dt>
              <dd>{legal.legal_name}</dd>
            </div>
            <div>
              <dt>Payee type</dt>
              <dd>
                {legal.payee_type === "BUSINESS" ? "Business" : "Individual"}
              </dd>
            </div>
            <div>
              <dt>Country</dt>
              <dd>{legal.country_code === "IN" ? "India" : "United States"}</dd>
            </div>
            <div>
              <dt>Address</dt>
              <dd>
                {[
                  legal.address_line1,
                  legal.address_line2,
                  legal.city,
                  legal.state_region,
                  legal.postal_code,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="creator-payout-settings__notice">
            Legal identity has not been provided. Tax identifiers, PAN, KYC, and
            verification are not collected here.
          </p>
        )}
      </SettingsSectionCard>

      {destinationOpen && legal ? (
        <CreatorPayoutDestinationDrawer
          legalProfile={legal}
          destination={destination}
          saving={saving}
          onClose={() => setDestinationOpen(false)}
          onSave={onReplaceDestination}
        />
      ) : null}

      {legalOpen ? (
        <CreatorLegalProfileDrawer
          legalProfile={legal}
          locksIdentityScope={Boolean(destination)}
          saving={saving}
          onClose={() => setLegalOpen(false)}
          onSave={onSaveLegalProfile}
        />
      ) : null}

      <SideDrawer
        isOpen={disableOpen}
        onClose={() => setDisableOpen(false)}
        title="Disable payout destination"
        subtitle="Future payout readiness will remain unavailable until a new destination is configured."
        width="460px"
        footer={
          <div className="creator-payout-settings__drawer-actions">
            <Button
              type="button"
              variant="ghost"
              disabled={saving}
              onClick={() => setDisableOpen(false)}
            >
              Keep destination
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => void disableDestination()}
            >
              {saving ? "Disabling…" : "Disable destination"}
            </Button>
          </div>
        }
      >
        {disableError ? (
          <div role="alert">
            <Alert tone="error" title="Destination not disabled">
              {disableError}
            </Alert>
          </div>
        ) : null}
        <p className="creator-payout-settings__notice">
          This does not delete historical payout records and does not execute,
          cancel, or settle any payout.
        </p>
      </SideDrawer>
    </div>
  );
}

function DestinationStateBadge({
  state,
}: {
  state: CreatorPayoutDestinationState;
}) {
  if (state === "NEEDS_ATTENTION") {
    return <Badge tone="error">Needs attention</Badge>;
  }
  if (state === "DISABLED") {
    return <Badge tone="neutral">Disabled</Badge>;
  }
  return <Badge tone="pending">Configured — not verified</Badge>;
}
