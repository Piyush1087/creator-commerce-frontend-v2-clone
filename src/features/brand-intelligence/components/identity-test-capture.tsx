import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FlaskConical, Loader2 } from "lucide-react";

import { Button, TextField } from "../../../design-system/aurora";
import { urlSchema } from "../../brand-onboarding/schemas/url-schema";
import {
  IdentityTestApiError,
  runIdentityTestDryRun,
} from "../api/identity-test-client";
import { BRAND_INTELLIGENCE_ROUTES } from "../constants";
import { saveIdentityTestResult } from "../session/identity-test-session";

import "../brand-intelligence.css";

export function IdentityTestCapture() {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const parsed = urlSchema.safeParse(url);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter a valid website URL.");
      return;
    }

    setIsBusy(true);
    try {
      const result = await runIdentityTestDryRun({ websiteUrl: parsed.data });
      saveIdentityTestResult(result);
      navigate(BRAND_INTELLIGENCE_ROUTES.identityTestResults);
    } catch (err) {
      if (err instanceof IdentityTestApiError && err.status === 404) {
        setError(
          "Dry-run endpoint is disabled in this environment (production returns 404).",
        );
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "Identity dry-run failed. Check API keys and try again.",
        );
      }
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <section className="bi-dry-run" aria-labelledby="bi-dry-run-title">
      <div className="bi-dry-run__header">
        <FlaskConical size={18} aria-hidden />
        <div>
          <h2 id="bi-dry-run-title" className="bi-dry-run__title">
            Brand Intelligence · Identity dry-run
          </h2>
          <p className="bi-dry-run__sub">
            Runs the frozen <code>identity_test</code> profile (Gatekeeper →
            Identity Core → niche / reporting currency / markets). No BrandProfile
            writes. Dev-only; requires live Gemini/Zyte.
          </p>
        </div>
      </div>

      <form className="bi-dry-run__form" onSubmit={handleSubmit}>
        <TextField
          label="Website URL for identity_test"
          name="identityTestUrl"
          placeholder="https://yourbrand.com"
          value={url}
          disabled={isBusy}
          autoComplete="off"
          onChange={(event) => {
            setUrl(event.target.value);
            if (error) setError(null);
          }}
          error={error ?? undefined}
          helperText={
            error
              ? undefined
              : "Separate from onboarding “Analyze My Brand”. Results open on a dedicated page."
          }
        />
        <div className="bi-dry-run__actions">
          <Button type="submit" variant="secondary" disabled={isBusy || !url.trim()}>
            {isBusy ? (
              <>
                <Loader2
                  size={16}
                  className="bi-dry-run__spinner"
                  aria-hidden
                />
                Running…
              </>
            ) : (
              "Run Identity Dry-Run"
            )}
          </Button>
        </div>
      </form>

      {isBusy ? (
        <div className="bi-dry-run__progress" role="status" aria-live="polite">
          <Loader2 size={20} className="bi-dry-run__spinner" aria-hidden />
          <span>Running identity_test…</span>
        </div>
      ) : null}
    </section>
  );
}
