import { useEffect, useRef, useState } from "react";
import { Link2 } from "lucide-react";

import { Button } from "../../../design-system/aurora";

import { urlSchema } from "../schemas/url-schema";

type LandingUrlCaptureProps = {
  isBusy: boolean;
  onSubmitUrl: (url: string) => void;
};

const LISTENING_MESSAGES = [
  "Locating brand servers...",
  "Analyzing industry signals...",
  "Verifying commercial DNA...",
  "Getting to know your brand...",
] as const;

export function LandingUrlCapture({
  isBusy,
  onSubmitUrl,
}: LandingUrlCaptureProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [listeningText, setListeningText] = useState<string>(
    LISTENING_MESSAGES[3],
  );
  const listenIndex = useRef(0);

  useEffect(() => {
    if (!listening) {
      return;
    }
    const id = window.setInterval(() => {
      listenIndex.current =
        (listenIndex.current + 1) % LISTENING_MESSAGES.length;
      setListeningText(LISTENING_MESSAGES[listenIndex.current]);
    }, 1500);
    return () => window.clearInterval(id);
  }, [listening]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = urlSchema.safeParse(url);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid URL.");
      return;
    }
    setError(null);
    setListening(true);
    window.setTimeout(() => {
      onSubmitUrl(parsed.data);
      setListening(false);
    }, 3000);
  };

  const rowClass = [
    "bob-url-row",
    error ? "bob-url-row--error" : "",
    listening || isBusy ? "bob-url-row--active" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <form className="bob-url-form" onSubmit={handleSubmit}>
      <div className={rowClass}>
        <Link2 size={20} color="var(--color-primary)" aria-hidden />
        <input
          className="bob-url-input"
          name="brandUrl"
          autoComplete="url"
          inputMode="url"
          placeholder="Your website URL (we'll take it from here)"
          value={url}
          disabled={listening || isBusy}
          onChange={(event) => {
            setUrl(event.target.value);
            if (error) {
              setError(null);
            }
          }}
        />
        <div className="bob-url-actions">
          <Button
            type="submit"
            variant="primary"
            disabled={listening || isBusy || !url.trim()}
          >
            Analyze My Brand
          </Button>
        </div>
      </div>
      <div className="bob-url-mobile-submit">
        <Button
          type="submit"
          variant="primary"
          fullWidthOnMobile
          disabled={listening || isBusy || !url.trim()}
        >
          Analyze My Brand
        </Button>
      </div>
      {error ? (
        <p className="bob-url-feedback bob-url-feedback--error">
          {error}
        </p>
      ) : null}
      {listening ? (
        <p className="aurora-field__helper bob-muted" style={{ marginTop: 8 }}>
          {listeningText}
        </p>
      ) : null}
    </form>
  );
}
