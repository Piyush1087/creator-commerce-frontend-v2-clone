import { Check, Circle, Globe2, Sparkles } from "lucide-react";

import type { BrandPreviewPhase } from "../contracts/brand-preview.contracts";

const PHASES: Array<{ phase: BrandPreviewPhase; label: string }> = [
  { phase: "UNDERSTANDING_BRAND", label: "Understanding your brand" },
  { phase: "LEARNING_AUDIENCE", label: "Learning who you need to reach" },
  { phase: "FINDING_CREATOR_OPPORTUNITIES", label: "Finding where creators can help" },
  { phase: "PREPARING_PREVIEW", label: "Preparing your Brand Preview" },
];

type FastBrandAnalysisViewProps = {
  displayDomain: string;
  phase: BrandPreviewPhase | null;
  slow: boolean;
};

export function FastBrandAnalysisView({
  displayDomain,
  phase,
  slow,
}: FastBrandAnalysisViewProps) {
  const activeIndex = phase
    ? PHASES.findIndex((entry) => entry.phase === phase)
    : -1;
  const liveStatus = phase
    ? PHASES.find((entry) => entry.phase === phase)?.label ??
      "Building your Brand Preview…"
    : slow
      ? "Still analysing…"
      : "Building your Brand Preview…";

  return (
    <main className="bp-analysis" aria-labelledby="bp-analysis-title">
      <div className="bp-analysis__surface">
        <div className="bp-domain-cue" aria-label={`Analyzing ${displayDomain}`}>
          <Globe2 size={17} aria-hidden />
          <span>{displayDomain}</span>
        </div>

        <div className="bp-analysis__intro">
          <p className="bp-eyebrow">Building your Brand Preview</p>
          <h1 id="bp-analysis-title" tabIndex={-1}>
            {slow
              ? "We're still building your Brand Preview."
              : "We're getting to know your brand."}
          </h1>
          <p className="bp-analysis__lead">
            {slow
              ? "This website is taking a little longer to understand, but the analysis is still moving. We'll show your Preview as soon as we have enough grounded information to make it useful."
              : "We’re learning what your brand stands for, who it needs to influence, and where creators could make the biggest difference."}
          </p>
        </div>

        <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {liveStatus}
        </p>

        <div className="bp-analysis__status-region">
          {phase ? (
            <ol className="bp-understanding-thread" aria-label="Brand Preview analysis progress">
              {PHASES.map((entry, index) => {
                const completed = activeIndex >= 0 && index < activeIndex;
                const current = index === activeIndex;
                return (
                  <li
                    key={entry.phase}
                    className={[
                      "bp-understanding-thread__item",
                      completed ? "is-complete" : "",
                      current ? "is-current" : "",
                      !completed && !current ? "is-future" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    aria-current={current ? "step" : undefined}
                  >
                    <span className="bp-understanding-thread__marker" aria-hidden>
                      {completed ? (
                        <Check size={15} strokeWidth={3} />
                      ) : current ? (
                        <Sparkles size={16} />
                      ) : (
                        <Circle size={12} />
                      )}
                    </span>
                    <span>{entry.label}</span>
                    <span className="sr-only">
                      {completed ? " — complete" : current ? " — current" : " — upcoming"}
                    </span>
                  </li>
                );
              })}
            </ol>
          ) : (
            <div className="bp-analysis__generic-status">
              <span className="bp-analysis__pulse" aria-hidden />
              <span>{slow ? "Still analysing…" : "Building your Brand Preview…"}</span>
            </div>
          )}
        </div>

        {slow ? (
          <div className="bp-analysis__reassurance">
            <p className="bp-analysis__slow-status">Still analysing…</p>
            <p>
              You don't need to stay on this screen once your Preview is ready. Deeper analysis can continue in the background after you move on.
            </p>
          </div>
        ) : null}
      </div>
    </main>
  );
}
