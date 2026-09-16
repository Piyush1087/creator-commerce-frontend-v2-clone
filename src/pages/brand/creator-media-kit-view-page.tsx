import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  readVerifiedMediaKit,
  revealMediaKitEmail,
  verifiedMediaKitPdf,
} from "../../features/creator-media-kit/creator-media-kit.client";
import type { VerifiedMediaKit } from "../../features/creator-media-kit/creator-media-kit.contracts";
import { downloadMediaKitPdf } from "../../features/creator-media-kit/creator-media-kit.pdf";
import { MediaKitProjection } from "../../features/creator-media-kit/components/media-kit-projection";
import "../../features/creator-media-kit/creator-media-kit.css";

export function BrandCreatorMediaKitViewPage() {
  const { publicId = "" } = useParams();
  const [kit, setKit] = useState<VerifiedMediaKit | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    void readVerifiedMediaKit(publicId)
      .then(setKit)
      .catch(() => setError(true));
  }, [publicId]);
  if (error)
    return (
      <div className="media-kit-public-state">
        <h1>Verified Media Kit unavailable</h1>
        <p>A LIVE Kit and active verified Brand membership are required.</p>
      </div>
    );
  if (!kit)
    return (
      <div className="media-kit-public-state" role="status">
        Authorizing verified view…
      </div>
    );
  return (
    <div className="media-kit-public-page">
      <div className="media-kit-verified-toolbar">
        <strong>Verified Brand view</strong>
        <button
          type="button"
          onClick={() =>
            void verifiedMediaKitPdf(publicId)
              .then(downloadMediaKitPdf)
              .catch(() => setError(true))
          }
        >
          Download PDF
        </button>
      </div>
      <MediaKitProjection
        value={kit}
        publicId={publicId}
        onRevealEmail={() =>
          void revealMediaKitEmail(publicId).then((result) =>
            setEmail(result.email),
          )
        }
      />
      <div className="media-kit-live-region" aria-live="polite">
        {email ? (
          <p>
            Business email: <a href={`mailto:${email}`}>{email}</a>
          </p>
        ) : null}
      </div>
    </div>
  );
}
