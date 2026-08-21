import { Globe2, RotateCcw, ShieldCheck } from "lucide-react";

import { Button } from "../../../design-system/aurora";

type AnalysisRecoveryViewProps = {
  kind: "RECOVERABLE" | "NOT_READY";
  displayDomain: string;
  brandName?: string;
  canRetry: boolean;
  retrying: boolean;
  onRetry: () => void;
};

export function AnalysisRecoveryView({
  kind,
  displayDomain,
  brandName,
  canRetry,
  retrying,
  onRetry,
}: AnalysisRecoveryViewProps) {
  const recoverable = kind === "RECOVERABLE";
  const title = recoverable
    ? "We couldn't finish your Brand Preview."
    : "We need a little more to understand this brand.";
  const body = recoverable
    ? "We weren't able to gather enough reliable information to build a Preview we trust. Nothing has been filled in with guesses."
    : "The website doesn't currently give us enough grounded information to build a Brand Preview that would be genuinely useful.";
  const support = recoverable
    ? "If the problem continues, you can return to your brand website check and try again later."
    : "A richer or more accessible brand website may give us enough context to continue.";

  return (
    <main className="bp-recovery" aria-labelledby="bp-recovery-title">
      <section className="bp-recovery__surface">
        <div className="bp-recovery__recognition">
          <div className="bp-recovery__trust-mark" aria-hidden>
            <ShieldCheck size={22} />
          </div>
          <div>
            {brandName ? <strong>{brandName}</strong> : null}
            <span className="bp-recovery__domain">
              <Globe2 size={14} aria-hidden />
              {displayDomain}
            </span>
          </div>
        </div>

        <div className="bp-recovery__copy">
          <p className="bp-eyebrow">Your Brand Preview</p>
          <h1 id="bp-recovery-title" tabIndex={-1}>{title}</h1>
          <p className="bp-recovery__body">{body}</p>
          <p className="bp-recovery__support">{support}</p>
        </div>

        {canRetry ? (
          <Button
            type="button"
            onClick={onRetry}
            disabled={retrying}
            aria-busy={retrying}
          >
            <RotateCcw size={16} aria-hidden />
            {retrying ? "Trying again…" : "Try again"}
          </Button>
        ) : null}
      </section>
    </main>
  );
}
