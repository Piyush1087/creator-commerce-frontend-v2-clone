import { useState } from "react";

import { useNavigate } from "react-router-dom";

import { Lock, ShieldCheck, Sparkles, TrendingUp, Wallet } from "lucide-react";



import { Alert, Button, Card, TextField } from "../../../design-system/aurora";

import { checkCreatorHandle, joinCreatorWaitlist } from "../api/creator-onboarding-client";

import { CREATOR_ONBOARDING_ROUTES } from "../constants";

import { LANDING_MARQUEE_HANDLES } from "../mock-data/onboarding-mock";

import { saveOnboardingEmail, saveOnboardingTrack } from "../utils/onboarding-session";

import { displayValue } from "../../creator-campaigns/utils/display-value";



import "../creator-onboarding.css";



const PROBLEMS = [

  {

    title: "DM chaos",

    body: "Brand briefs buried in Instagram requests with no structured pipeline.",

    Icon: Sparkles,

  },

  {

    title: "Stale media kits",

    body: "PDF decks that never update when your metrics change week to week.",

    Icon: TrendingUp,

  },

  {

    title: "Payment anxiety",

    body: "Chasing invoices after you have already shipped the content.",

    Icon: Wallet,

  },

] as const;



export function CreatorLandingPageView() {

  const navigate = useNavigate();

  const [handle, setHandle] = useState("");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [waitlistTrackId, setWaitlistTrackId] = useState<string | null>(null);

  const [waitlistEmail, setWaitlistEmail] = useState("");

  const [waitlistDone, setWaitlistDone] = useState(false);



  const onCheckEligibility = async () => {

    const normalized = handle.trim().replace(/^@/, "");

    if (!normalized) {

      setError("Enter your Instagram handle.");

      return;

    }

    setLoading(true);

    setError(null);

    try {

      const result = await checkCreatorHandle(normalized);

      saveOnboardingTrack(result.onboardingTrackId, normalized);

      if (result.outcome === "waitlisted") {

        setWaitlistTrackId(result.onboardingTrackId);

        return;

      }

      navigate(CREATOR_ONBOARDING_ROUTES.modules);

    } catch (err) {

      setError(err instanceof Error ? err.message : "Eligibility check failed.");

    } finally {

      setLoading(false);

    }

  };



  const onJoinWaitlist = async (e: React.FormEvent) => {

    e.preventDefault();

    if (!waitlistTrackId || !waitlistEmail.trim()) return;

    setLoading(true);

    setError(null);

    try {

      await joinCreatorWaitlist(waitlistTrackId, waitlistEmail.trim());

      saveOnboardingEmail(waitlistEmail.trim());

      setWaitlistDone(true);

    } catch (err) {

      setError(err instanceof Error ? err.message : "Waitlist signup failed.");

    } finally {

      setLoading(false);

    }

  };



  if (waitlistTrackId) {

    return (

      <div className="cob-page" style={{ paddingTop: 48 }}>

        <Card className="cob-modal-panel">

          <h1 style={{ fontFamily: "var(--font-heading)", margin: "0 0 8px" }}>

            {waitlistDone ? "You are on the waitlist" : "Join the founding waitlist"}

          </h1>

          <p className="cob-muted">

            {waitlistDone

              ? "We will notify you when your handle is approved for onboarding."

              : "This handle did not pass automated eligibility yet. Leave your email to get notified."}

          </p>

          {!waitlistDone ? (

            <form className="cob-form-stack" onSubmit={(e) => void onJoinWaitlist(e)}>

              <TextField

                label="Email"

                type="email"

                value={waitlistEmail}

                onChange={(e) => setWaitlistEmail(e.target.value)}

                required

              />

              {error ? (

                <Alert tone="error" title="Could not join waitlist">

                  {error}

                </Alert>

              ) : null}

              <Button variant="primary" type="submit" disabled={loading}>

                {loading ? "Submitting…" : "Join Waitlist"}

              </Button>

            </form>

          ) : (

            <p className="cob-muted" style={{ marginTop: 16 }}>

              Eligibility score: {displayValue("-")}

            </p>

          )}

        </Card>

      </div>

    );

  }



  return (

    <div className="cob-page">

      <section className="cob-hero">

        <span className="cob-badge">Free for our first 500 founding creators</span>

        <h1>

          Turn Your Instagram Into Your <em>Creator Business.</em>

        </h1>

        <p>

          Check your handle, stage your workspace modules, and launch a live media kit

          brands can trust — without rebuilding your workflow from scratch.

        </p>

        <div className="cob-handle-row">

          <TextField

            label="Instagram handle"

            value={handle}

            onChange={(e) => setHandle(e.target.value)}

            placeholder="@travelwithme"

            autoComplete="off"

          />

          <Button variant="primary" onClick={() => void onCheckEligibility()} disabled={loading}>

            {loading ? "Checking…" : "See if I'm Eligible"}

          </Button>

        </div>

        {error ? (
          <div style={{ marginTop: 16 }}>
            <Alert tone="error" title="Eligibility check">
              {error}
            </Alert>
          </div>
        ) : null}

        <div className="cob-marquee" aria-hidden>

          {LANDING_MARQUEE_HANDLES.map((tag) => (

            <span key={tag}>{tag}</span>

          ))}

        </div>

        <p className="cob-muted" style={{ marginTop: 24 }}>

          <Lock size={14} style={{ verticalAlign: "middle", marginRight: 6 }} />

          Your Instagram account won&apos;t be modified during eligibility check.

        </p>

      </section>



      <section className="cob-section">

        <h2 className="cob-section-title">The Creator Struggle</h2>

        <div className="cob-grid-3">

          {PROBLEMS.map(({ title, body, Icon }) => (

            <Card key={title} className="cob-problem-card">

              <Icon size={22} color="var(--primary)" aria-hidden />

              <h3 style={{ fontFamily: "var(--font-heading)", margin: "12px 0 8px" }}>

                {title}

              </h3>

              <p className="cob-muted">{body}</p>

            </Card>

          ))}

        </div>

      </section>



      <section className="cob-section" style={{ textAlign: "center" }}>

        <h2 className="cob-section-title">Built for professional creators</h2>

        <p className="cob-muted" style={{ maxWidth: 560, margin: "0 auto 24px" }}>

          Auto-updating media kits, a gated brand inbox, and escrow-ready payouts —

          orchestrated from one command center.

        </p>

        <Button variant="primary" onClick={() => void onCheckEligibility()} disabled={loading}>

          Claim Founding Access

        </Button>

        <p className="cob-muted" style={{ marginTop: 16 }}>

          <ShieldCheck size={14} style={{ verticalAlign: "middle", marginRight: 6 }} />

          Requires <code>GEMINI_API_KEY</code> on backend for approved handles.

        </p>

      </section>

    </div>

  );

}


