import { useRef } from "react";
import { Link } from "react-router-dom";
import { Button, Card, Alert } from "../../../design-system/aurora";
import { AUTH_ROUTES } from "../../auth/constants";
import { useCommercialSetup } from "../hooks/use-commercial-setup";
import { WorkPreferencesForm } from "./work-preferences-form";
import { RateCardForm } from "./rate-card-form";
import "../commercial-setup.css";
export function CommercialWorkspace() {
  const state = useCommercialSetup(),
    errorBox = useRef<HTMLDivElement>(null);
  const disabled = !state.authorized || state.conflict || state.pending;
  if (state.loading && !state.work && !state.rates)
    return (
      <section className="commercial-workspace" aria-busy="true">
        <h1>Commercial Setup</h1>
        <p role="status">Loading Work Preferences and Rate Card…</p>
      </section>
    );
  return (
    <section className="commercial-workspace">
      <h1>Commercial Setup</h1>
      <p>
        Configure manual preferences and starting-from references. No Instagram
        connection or Intelligence result is required.
      </p>
      <nav
        aria-label="Commercial Setup sections"
        className="commercial-section-nav"
      >
        <a className="aurora-tab" href="#work-preferences">
          Work Preferences
        </a>
        <a className="aurora-tab" href="#rate-card">
          Rate Card
        </a>
      </nav>
      <p role="status" aria-live="polite">
        {state.announcement}
      </p>
      {state.error && (
        <div ref={errorBox} tabIndex={-1} role="alert">
          <Alert tone="error" title="Commercial Setup needs attention">
            {state.error}
          </Alert>
          <Button
            variant="secondary"
            type="button"
            disabled={state.pending}
            onClick={() => void state.retry()}
          >
            Retry loading Commercial Setup
          </Button>
        </div>
      )}
      {!state.authorized && (
        <p role="alert">
          Editing is unavailable because access could not be authorized.
          Previously confirmed values are not permission to mutate.
        </p>
      )}
      {state.conflict && (
        <div role="alert">
          <p>
            Latest confirmed values have been fetched. Your draft is preserved;
            review it against the updated values before trying again.
          </p>
          <Button type="button" variant="secondary" onClick={state.reviewed}>
            I reviewed the latest values
          </Button>
        </div>
      )}
      <Card>
        <section id="work-preferences" tabIndex={-1}>
          <h2>Work Preferences</h2>
          {state.work ? (
            <>
              <p>
                Confirmed revision {state.work.currentRevision}.{" "}
                {state.work.state === "UNCONFIGURED"
                  ? "Availability defaults to accepting collaborations; every other question is unanswered."
                  : "Your manually configured preferences."}
              </p>
              <WorkPreferencesForm
                work={state.work}
                rates={state.rates}
                pending={state.pending}
                disabled={disabled || !state.rates}
                save={async (command) => {
                  const saved = await state.saveWork(command);
                  if (!saved)
                    requestAnimationFrame(() => errorBox.current?.focus());
                  return saved;
                }}
              />
              <h3>Operational readiness — read-only</h3>
              <p>
                Shipping: {state.work.readiness.shipping.replace(/_/g, " ")}.
                Payout: {state.work.readiness.payout.replace(/_/g, " ")}. KYC:
                Coming soon.
              </p>
              <p>
                Readiness comes from Settings/Payouts and never determines
                willingness or grants eligibility.
              </p>
              {state.work.context.role !== "ASSISTANT" ? (
                <div className="commercial-links">
                  <Link to={AUTH_ROUTES.creatorSettingsProfile}>
                    Open shipping/contact Settings
                  </Link>
                  <Link to={AUTH_ROUTES.creatorSettingsPayouts}>
                    Open payout Settings
                  </Link>
                </div>
              ) : (
                <p>
                  Ask an Owner or Manager to recover shipping or payout setup in
                  Settings. This read action grants no Settings access.
                </p>
              )}
            </>
          ) : (
            <p>
              Work Preferences is unavailable. Retry without losing the
              available Rate Card.
            </p>
          )}
        </section>
      </Card>
      <Card>
        <section id="rate-card" tabIndex={-1}>
          <h2>Rate Card</h2>
          {state.rates ? (
            <>
              <p>
                Confirmed revision {state.rates.currentRevision}.{" "}
                {state.rates.state === "UNCONFIGURED"
                  ? "No starting prices configured."
                  : "Independent canonical Rate Card."}
              </p>
              <RateCardForm
                rates={state.rates}
                work={state.work}
                pending={state.pending}
                disabled={disabled || !state.work}
                save={async (command) => {
                  const saved = await state.saveRates(command);
                  if (!saved)
                    requestAnimationFrame(() => errorBox.current?.focus());
                  return saved;
                }}
              />
              {state.rates.country.state === "CONFLICT" &&
                state.rates.context.role !== "ASSISTANT" && (
                  <Link to={AUTH_ROUTES.creatorSettingsPayouts}>
                    Recover country authority in Settings/Payouts
                  </Link>
                )}
            </>
          ) : (
            <p>
              Rate Card is unavailable. Retry without losing confirmed Work
              Preferences.
            </p>
          )}
        </section>
      </Card>
    </section>
  );
}
