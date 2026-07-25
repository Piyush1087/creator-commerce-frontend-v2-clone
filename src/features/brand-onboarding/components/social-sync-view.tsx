import { useNavigate } from "react-router-dom";
import {
  BarChart2,
  Search,
  Volume2,
  ShieldCheck,
  Lock,
  CheckCircle2,
} from "lucide-react";

import { Button } from "../../../design-system/aurora";
import { AUTH_ROUTES } from "../../auth/constants";

export function SocialSyncView() {
  const navigate = useNavigate();

  return (
    <div className="bob-verify bob-verify--hide-nav bob-social-sync">
      <div className="bob-verify__split">
        <section className="bob-verify__left" aria-labelledby="social-sync-title">
          <div className="bob-verify__left-inner bob-social-sync__left-inner">
            <header className="bob-social-sync__header">
              <h1 id="social-sync-title" className="bob-verify__title">
                Unleash Verified Intelligence
              </h1>
              <p className="bob-verify__lead bob-social-sync__lead">
                Sync your Meta Business Manager to transition from AI estimates to
                verified performance data.
              </p>
            </header>

            <div className="bob-social-sync__permissions" aria-label="What you unlock">
              <div className="bob-social-sync__permission">
                <BarChart2 size={22} aria-hidden />
                <div>
                  <h3>Performance Insights</h3>
                  <p>Analyze reach, saves, and conversion metrics.</p>
                </div>
              </div>
              <div className="bob-social-sync__permission">
                <Search size={22} aria-hidden />
                <div>
                  <h3>Business Discovery</h3>
                  <p>Monitor competitor growth and content shifts in real-time.</p>
                </div>
              </div>
              <div className="bob-social-sync__permission">
                <Volume2 size={22} aria-hidden />
                <div>
                  <h3>Creator Marketplace</h3>
                  <p>Priority DM access to land in creator Primary inboxes.</p>
                </div>
              </div>
            </div>

            <Button
              type="button"
              variant="primary"
              className="bob-social-sync__connect"
              onClick={() => navigate("/")}
            >
              <svg
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
                className="bob-social-sync__meta-icon"
              >
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987H7.898v-2.891h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562v1.875h2.773l-.443 2.891h-2.33v6.987C18.343 21.128 22 16.991 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
              Connect Meta Business Manager
            </Button>

            <div className="bob-social-sync__footer">
              <button
                type="button"
                className="bob-link"
                onClick={() => navigate(AUTH_ROUTES.brandCentre)}
              >
                Skip for now
              </button>

              <div className="bob-social-sync__trust" aria-label="Trust signals">
                <span>
                  <ShieldCheck size={14} aria-hidden />
                  Meta Tech Provider
                </span>
                <span>
                  <Lock size={14} aria-hidden />
                  SSL Secure
                </span>
                <span>
                  <CheckCircle2 size={14} aria-hidden />
                  GDPR Compliant
                </span>
              </div>
            </div>
          </div>
        </section>

        <section
          className="bob-verify__right bob-verify__right--desktop-only bob-social-sync__right"
          aria-label="Dashboard preview"
        >
          <div className="bob-social-sync__right-inner">
            <div className="bob-social-sync__pill">
              <Lock size={14} aria-hidden />
              API Connected: Creator Marketplace Unlocked
            </div>

            <h2 className="bob-social-sync__preview-title">Dashboard Sneak-Peek</h2>

            <div className="bob-social-sync__preview-panel">
              <div className="bob-social-sync__preview-window">
                <div className="bob-social-sync__dots" aria-hidden>
                  <span />
                  <span />
                  <span />
                </div>
                <div className="bob-social-sync__window-label">Global Analytics v5.0</div>
              </div>

              <div className="bob-social-sync__preview-grid">
                <div className="bob-social-sync__preview-col">
                  <p className="bob-social-sync__col-label bob-social-sync__col-label--muted">
                    Estimated Engagement
                  </p>
                  <div className="bob-social-sync__blur-card" aria-hidden>
                    <span />
                    <span />
                    <span />
                    <strong>~42.5k</strong>
                  </div>
                </div>

                <div className="bob-social-sync__preview-col">
                  <p className="bob-social-sync__col-label bob-social-sync__col-label--live">
                    Verified API Data
                  </p>
                  <div className="bob-social-sync__live-card">
                    <div className="bob-social-sync__live-head">
                      <div>
                        <span>Accuracy Score</span>
                        <strong>Match: 98%</strong>
                      </div>
                      <ShieldCheck size={20} aria-hidden />
                    </div>
                    <div className="bob-social-sync__mini-bars" aria-hidden>
                      <span style={{ height: "35%" }} />
                      <span style={{ height: "60%" }} />
                      <span style={{ height: "50%" }} />
                      <span className="bob-social-sync__mini-bars--peak" style={{ height: "95%" }} />
                      <span style={{ height: "70%" }} />
                    </div>
                    <div className="bob-social-sync__live-feed">
                      <span>Real-time feed</span>
                      <span>
                        <i aria-hidden /> Live
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bob-social-sync__preview-meta">
                <div>
                  <p>Current Data Source</p>
                  <strong>Meta API Connection</strong>
                </div>
                <div>
                  <p>Latency</p>
                  <strong className="bob-social-sync__latency">Real-time (0.4ms)</strong>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
