import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  readPublicMediaKit,
  revealMediaKitEmail,
} from "../../features/creator-media-kit/creator-media-kit.client";
import type { PublicMediaKit } from "../../features/creator-media-kit/creator-media-kit.contracts";
import { MediaKitProjection } from "../../features/creator-media-kit/components/media-kit-projection";
import "../../features/creator-media-kit/creator-media-kit.css";

export function PublicCreatorMediaKitPage() {
  const { publicId = "" } = useParams();
  const [kit, setKit] = useState<PublicMediaKit | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [handoff, setHandoff] = useState(false);

  useEffect(() => {
    let meta = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "robots";
      document.head.append(meta);
    }
    meta.content = "noindex,nofollow,noarchive";
    document.title = "Creator Media Kit";
  }, []);
  useEffect(() => {
    setError(false);
    void readPublicMediaKit(publicId)
      .then(setKit)
      .catch(() => setError(true));
  }, [publicId]);

  if (error)
    return (
      <main className="media-kit-public-state">
        <h1>Media Kit unavailable</h1>
        <p>This Media Kit is not currently published.</p>
      </main>
    );
  if (!kit)
    return (
      <main className="media-kit-public-state" role="status">
        Loading Media Kit…
      </main>
    );

  return (
    <main className="media-kit-public-page">
      <MediaKitProjection
        value={kit}
        publicId={kit.publicId}
        onRevealEmail={() => {
          void revealMediaKitEmail(kit.publicId).then((result) =>
            setEmail(result.email),
          );
        }}
        onWorkWithCreator={() => setHandoff(true)}
      />
      <div className="media-kit-live-region" aria-live="polite">
        {email ? (
          <p>
            Business email: <a href={`mailto:${email}`}>{email}</a>
          </p>
        ) : null}
        {handoff ? (
          <p>
            Interest recorded. No downstream journey is configured by Media Kit.
          </p>
        ) : null}
      </div>
    </main>
  );
}
