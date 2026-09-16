import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, Toggle } from "../../../design-system/aurora";
import {
  creatorMediaKitPdf,
  mutateCreatorMediaKit,
  readCreatorMediaKit,
} from "../creator-media-kit.client";
import type { CreatorMediaKit } from "../creator-media-kit.contracts";
import { downloadMediaKitPdf } from "../creator-media-kit.pdf";
import { MediaKitProjection } from "./media-kit-projection";
import "../creator-media-kit.css";

export function CreatorMediaKitWorkspace() {
  const [kit, setKit] = useState<CreatorMediaKit | null>(null);
  const [mode, setMode] = useState<"PUBLIC" | "VERIFIED">("VERIFIED");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setKit(await readCreatorMediaKit());
    } catch {
      setError("Media Kit could not be loaded. Try again.");
    }
  }, []);
  useEffect(() => void load(), [load]);

  const canManage = kit?.allowedActions.includes("MEDIA_KIT_MANAGE") ?? false;
  const canPublish = kit?.allowedActions.includes("MEDIA_KIT_PUBLISH") ?? false;
  const canPdf =
    kit?.allowedActions.includes("MEDIA_KIT_PDF_DOWNLOAD") ?? false;

  const save = async (next: CreatorMediaKit["configuration"]) => {
    if (!kit) return;
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      await mutateCreatorMediaKit({
        intent: "UPDATE_CONFIGURATION",
        expectedRevision: kit.configuration.revision,
        idempotencyKey: crypto.randomUUID(),
        visibility: next.visibility,
        publicVisuals: next.publicVisuals,
        featuredPortfolioItemIds: next.featuredPortfolioItemIds,
      });
      await load();
      setMessage("Media Kit settings saved.");
    } catch (cause) {
      setError(
        cause instanceof Error && cause.message.includes("409")
          ? "This Media Kit changed elsewhere. Reload and try again."
          : "Media Kit settings could not be saved.",
      );
    } finally {
      setBusy(false);
    }
  };

  const lifecycle = async (intent: "PUBLISH" | "UNPUBLISH") => {
    if (!kit) return;
    setBusy(true);
    setError(null);
    try {
      await mutateCreatorMediaKit({
        intent,
        expectedRevision: kit.configuration.revision,
        idempotencyKey: crypto.randomUUID(),
      });
      await load();
      setMessage(
        intent === "PUBLISH"
          ? "Media Kit is live."
          : "Media Kit is now a draft.",
      );
    } catch {
      setError("Lifecycle change failed. Reload and try again.");
    } finally {
      setBusy(false);
    }
  };

  const publicUrl = kit
    ? `${window.location.origin}${kit.configuration.publicPath}`
    : "";
  const portfolioInventory =
    kit?.preview.sections.portfolio?.eligibleItems ?? [];
  const representatives = kit?.preview.sections.content?.representatives ?? [];
  const selectedVisualIds = useMemo(
    () =>
      new Set(kit?.configuration.publicVisuals.map((item) => item.visualId)),
    [kit],
  );

  if (!kit && !error)
    return (
      <p className="media-kit-loading" role="status">
        Loading Media Kit…
      </p>
    );

  return (
    <div className="media-kit-workspace">
      <header className="media-kit-workspace__header">
        <div>
          <p className="media-kit-eyebrow">Creator Centre</p>
          <h1>Media Kit</h1>
          <p>
            A living reference for brands, composed from your current Creator
            Centre facts.
          </p>
        </div>
        {kit ? (
          <div className="media-kit-workspace__header-actions">
            <span
              className={
                "media-kit-status media-kit-status--" +
                kit.configuration.lifecycle.toLowerCase()
              }
            >
              {kit.configuration.lifecycle}
            </span>
            {canPublish ? (
              <Button
                disabled={busy}
                onClick={() =>
                  void lifecycle(
                    kit.configuration.lifecycle === "LIVE"
                      ? "UNPUBLISH"
                      : "PUBLISH",
                  )
                }
              >
                {kit.configuration.lifecycle === "LIVE"
                  ? "Unpublish"
                  : "Publish"}
              </Button>
            ) : null}
          </div>
        ) : null}
      </header>

      {error ? (
        <Alert tone="error" title="Media Kit">
          {error}
        </Alert>
      ) : null}
      {message ? (
        <Alert tone="success" title="Media Kit">
          {message}
        </Alert>
      ) : null}

      {kit ? (
        <div className="media-kit-workspace__grid">
          <aside aria-label="Media Kit controls">
            <Card>
              <h2>Share</h2>
              <p>
                Your stable link exists in DRAFT and LIVE, but anonymous
                visitors can open it only while LIVE.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  void navigator.clipboard.writeText(publicUrl);
                  setMessage("Stable Media Kit link copied.");
                }}
              >
                Copy link
              </Button>
            </Card>

            <Card>
              <h2>Preview</h2>
              <div
                className="media-kit-segmented"
                role="group"
                aria-label="Preview audience"
              >
                <button
                  type="button"
                  aria-pressed={mode === "PUBLIC"}
                  onClick={() => setMode("PUBLIC")}
                >
                  Public view
                </button>
                <button
                  type="button"
                  aria-pressed={mode === "VERIFIED"}
                  onClick={() => setMode("VERIFIED")}
                >
                  Verified Brand view
                </button>
              </div>
            </Card>

            <Card>
              <h2>Verified sections</h2>
              {(["audience", "content", "portfolio", "rateCard"] as const).map(
                (section) =>
                  canManage ? (
                    <Toggle
                      key={section}
                      label={
                        "Show " +
                        (section === "rateCard"
                          ? "Rate Card"
                          : section[0].toUpperCase() + section.slice(1))
                      }
                      checked={kit.configuration.visibility[section]}
                      onChange={(checked) => {
                        if (!busy)
                          void save({
                            ...kit.configuration,
                            visibility: {
                              ...kit.configuration.visibility,
                              [section]: checked,
                            },
                          });
                      }}
                    />
                  ) : (
                    <p key={section}>
                      {section === "rateCard"
                        ? "Rate Card"
                        : section[0].toUpperCase() + section.slice(1)}
                      :{" "}
                      {kit.configuration.visibility[section]
                        ? "Shown"
                        : "Hidden"}
                    </p>
                  ),
              )}
            </Card>

            <Card>
              <h2>Public visuals</h2>
              <p>Select up to three current source references.</p>
              {representatives.length === 0 ? (
                <p>No eligible visual reference is currently available.</p>
              ) : (
                representatives.map((item) => {
                  const checked = selectedVisualIds.has(item.visualId);
                  return (
                    <label key={item.visualId} className="media-kit-choice">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={
                          !canManage ||
                          busy ||
                          (!checked &&
                            kit.configuration.publicVisuals.length >= 3)
                        }
                        onChange={(event) => {
                          const publicVisuals = event.target.checked
                            ? [
                                ...kit.configuration.publicVisuals,
                                {
                                  visualId: item.visualId,
                                  sourceDestination: item.sourceDestination,
                                  staticAssetUrl: null,
                                  altText: item.reason ?? "Creator work",
                                },
                              ]
                            : kit.configuration.publicVisuals.filter(
                                (visual) => visual.visualId !== item.visualId,
                              );
                          void save({ ...kit.configuration, publicVisuals });
                        }}
                      />
                      <span>{item.reason ?? item.visualId}</span>
                    </label>
                  );
                })
              )}
            </Card>

            <Card>
              <h2>Featured Portfolio</h2>
              <p>
                Select and order up to six. Four are required only when at least
                four eligible items exist.
              </p>
              {portfolioInventory.map((item) => {
                const selected =
                  kit.configuration.featuredPortfolioItemIds.includes(item.id);
                return (
                  <label key={item.id} className="media-kit-choice">
                    <input
                      type="checkbox"
                      checked={selected}
                      disabled={
                        !canManage ||
                        busy ||
                        (!selected &&
                          kit.configuration.featuredPortfolioItemIds.length >=
                            6)
                      }
                      onChange={(event) => {
                        const featuredPortfolioItemIds = event.target.checked
                          ? [
                              ...kit.configuration.featuredPortfolioItemIds,
                              item.id,
                            ]
                          : kit.configuration.featuredPortfolioItemIds.filter(
                              (id) => id !== item.id,
                            );
                        void save({
                          ...kit.configuration,
                          featuredPortfolioItemIds,
                        });
                      }}
                    />
                    <span>{String(item.title ?? "Work reference")}</span>
                  </label>
                );
              })}
            </Card>

            {canPdf ? (
              <Card>
                <h2>PDF snapshot</h2>
                <p>
                  Downloads the current Verified view as a point-in-time file.
                </p>
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() =>
                    void creatorMediaKitPdf()
                      .then(downloadMediaKitPdf)
                      .catch(() =>
                        setError(
                          "PDF generation failed. Your live Media Kit was not changed.",
                        ),
                      )
                  }
                >
                  Download PDF
                </Button>
              </Card>
            ) : null}
          </aside>

          <div className="media-kit-preview-frame">
            <MediaKitProjection
              value={kit.preview}
              publicId={kit.configuration.publicId}
              publicOnly={mode === "PUBLIC"}
              onRevealEmail={() =>
                setMessage(
                  "Email reveal is shown only on the live public view.",
                )
              }
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
