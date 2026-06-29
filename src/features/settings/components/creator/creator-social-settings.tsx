import { useState } from "react";

import { Instagram, Loader2, PlayCircle, Video } from "lucide-react";



import { Alert, Badge, Button } from "../../../../design-system/aurora";

import type { SocialPlatform } from "../../contracts/creator-settings.contracts";

import { useCreatorSocialSettings } from "../../hooks/use-creator-social-settings";

import {

  formatSettingsDate,

  settingsDisplayText,

  SOCIAL_PLATFORM_CATALOG,

} from "../../utils/creator-settings-display";

import { SettingsSectionCard } from "../settings-section-card";



const ICONS = {

  instagram: Instagram,

  tiktok: Video,

  youtube: PlayCircle,

} as const;



function isConnected(

  platform: SocialPlatform,

  channels: ReturnType<typeof useCreatorSocialSettings>["data"],

) {

  const row = channels?.channels.find((c) => c.platform === platform);

  return row !== undefined && row.token_state !== "REVOKED" && row.is_token_valid;

}



function channelRow(

  platform: SocialPlatform,

  channels: ReturnType<typeof useCreatorSocialSettings>["data"],

) {

  return channels?.channels.find((c) => c.platform === platform);

}



export function CreatorSocialSettings() {

  const { data, loading, error, disconnecting, disconnect } = useCreatorSocialSettings();

  const [disconnectPlatform, setDisconnectPlatform] = useState<SocialPlatform | null>(null);



  const readOnly = data?.is_read_only ?? false;



  const handleDisconnect = async () => {

    if (!disconnectPlatform) {

      return;

    }

    try {

      await disconnect(disconnectPlatform);

      setDisconnectPlatform(null);

    } catch {

      /* error surfaced via hook */

    }

  };



  if (loading && !data) {

    return (

      <div className="settings-page-stack settings-page-stack--centered">

        <Loader2 size={28} className="brand-escrow-spin" aria-hidden />

        <p className="cc-muted">Loading social channels…</p>

      </div>

    );

  }



  return (

    <>

      {error ? (

        <Alert tone="error" title="Could not load social channels">

          {error}

        </Alert>

      ) : null}



      <div className="settings-page-stack">

        {SOCIAL_PLATFORM_CATALOG.map((catalog) => {

          const Icon = ICONS[catalog.icon];

          const connected = isConnected(catalog.platform, data);

          const row = channelRow(catalog.platform, data);



          return (

            <SettingsSectionCard

              key={catalog.platform}

              title={catalog.title}

              description={catalog.description}

              action={

                connected ? (

                  <button

                    type="button"

                    className="settings-team__action-link"

                    disabled={readOnly || disconnecting}

                    onClick={() => setDisconnectPlatform(catalog.platform)}

                  >

                    Disconnect channel

                  </button>

                ) : (

                  <Button variant="primary" disabled title="OAuth connect flow not yet available">

                    Link {catalog.platform.charAt(0) + catalog.platform.slice(1).toLowerCase()}{" "}

                    account

                  </Button>

                )

              }

            >

              <div className="settings-social-channel">

                <span className="settings-social-channel__icon" aria-hidden>

                  <Icon size={22} />

                </span>

                <div>

                  {connected && row ? (

                    <>

                      <p className="settings-social-channel__handle">

                        {settingsDisplayText(row.handle ?? row.display_title)}

                      </p>

                      <Badge tone={row.is_token_valid ? "success" : "pending"}>

                        {row.is_token_valid ? "Syncing live data" : "Token requires attention"}

                      </Badge>

                      <p className="settings-social-channel__meta">

                        Last updated: {formatSettingsDate(row.last_metadata_sync_at)} • Token:{" "}

                        {settingsDisplayText(row.token_state)}

                      </p>

                    </>

                  ) : (

                    <>

                      <Badge tone="neutral">Not connected</Badge>

                      <p className="settings-social-channel__meta">{catalog.connectHint}</p>

                    </>

                  )}

                </div>

              </div>

            </SettingsSectionCard>

          );

        })}



        <hr className="settings-section-divider" />



        <SettingsSectionCard

          title="Google workspace & Gmail pitch sync (forthcoming)"

          description="Unlock direct inbound pitch monitoring and organize brand partnership inquiries into an automated workflow pipeline."

          className="settings-roadmap-card"

        >

          <Badge tone="pending">Future platform extension — Q4 2026</Badge>

          <Button variant="outline" disabled>

            Integration locked

          </Button>

        </SettingsSectionCard>

      </div>



      {disconnectPlatform ? (

        <div className="settings-modal-overlay" role="presentation">

          <div className="settings-modal" role="dialog">

            <h3>Sever secure external data connection?</h3>

            <p>

              Removing this connection will hide live view metrics, pause campaign reporting, and

              halt active brand payments requiring metric verification.

            </p>

            <div className="settings-modal__actions">

              <Button

                variant="ghost"

                onClick={() => setDisconnectPlatform(null)}

                disabled={disconnecting}

              >

                Cancel and keep connected

              </Button>

              <Button variant="primary" disabled={disconnecting} onClick={() => void handleDisconnect()}>

                {disconnecting ? "Disconnecting…" : "Confirm disconnect"}

              </Button>

            </div>

          </div>

        </div>

      ) : null}

    </>

  );

}


