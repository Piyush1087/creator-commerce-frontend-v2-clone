import { useNavigate } from "react-router-dom";
import { BarChart2, Search, Volume2, ShieldCheck, Lock, CheckCircle2 } from "lucide-react";

import { Button } from "../../../design-system/aurora";
import { AUTH_ROUTES } from "../../auth/constants";

export function SocialSyncView() {
  const navigate = useNavigate();

  return (
    <div className="bob-verify">
      <div className="bob-verify__split">
        {/* Left Pane (Matches verify-view layout) */}
        <section className="bob-verify__left" aria-labelledby="social-sync-title">
          <div className="bob-verify__left-inner">
            <header className="bob-verify__header" style={{ marginBottom: "2rem" }}>
              <h1 id="social-sync-title" className="bob-verify__title">
                Unleash Verified Intelligence
              </h1>
              <p className="bob-verify__lead" style={{ marginBottom: 0 }}>
                Sync your Meta Business Manager to transition from AI estimates to verified performance data.
              </p>
            </header>

            {/* Permissions Box */}
            <div
              className="bob-setup-includes"
              style={{
                background: "var(--surface-card)",
                border: "1px solid var(--border-default)",
                marginBottom: "2rem",
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
                padding: "1.5rem",
              }}
            >
              <div style={{ alignItems: "flex-start", display: "flex", gap: "1rem" }}>
                <BarChart2 size={24} style={{ color: "var(--color-primary)", marginTop: "2px" }} />
                <div>
                  <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-high)", margin: "0 0 4px" }}>
                    Performance Insights
                  </h3>
                  <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: 0 }}>
                    Analyze reach, saves, and conversion metrics.
                  </p>
                </div>
              </div>
              
              <div style={{ alignItems: "flex-start", display: "flex", gap: "1rem" }}>
                <Search size={24} style={{ color: "var(--color-primary)", marginTop: "2px" }} />
                <div>
                  <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-high)", margin: "0 0 4px" }}>
                    Business Discovery
                  </h3>
                  <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: 0 }}>
                    Monitor competitor growth and content shifts in real-time.
                  </p>
                </div>
              </div>

              <div style={{ alignItems: "flex-start", display: "flex", gap: "1rem" }}>
                <Volume2 size={24} style={{ color: "var(--color-primary)", marginTop: "2px" }} />
                <div>
                  <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-high)", margin: "0 0 4px" }}>
                    Creator Marketplace
                  </h3>
                  <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: 0 }}>
                    Priority DM access to land in creator Primary inboxes.
                  </p>
                </div>
              </div>
            </div>

            {/* Main Action */}
            <div style={{ marginBottom: "2rem" }}>
              <Button
                type="button"
                variant="primary"
                fullWidthOnMobile
                style={{
                  width: "100%",
                  minHeight: "56px",
                  fontSize: "16px",
                  boxShadow: "0 8px 16px rgba(52, 211, 153, 0.2)",
                }}
                onClick={() => navigate("/")}
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" style={{ width: 24, height: 24, marginRight: 12 }}>
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987H7.898v-2.891h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562v1.875h2.773l-.443 2.891h-2.33v6.987C18.343 21.128 22 16.991 22 12c0-5.523-4.477-10-10-10z"></path>
                </svg>
                Connect Meta Business Manager
              </Button>
            </div>

            {/* Fallback box */}
            <div style={{ background: "var(--surface-page)", padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--border-default)", marginBottom: "2rem" }}>
              <h3 style={{ fontSize: "14px", fontWeight: 700, margin: "0 0 4px" }}>Not the Account Admin?</h3>
              <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: "0 0 16px" }}>Invite your manager or admin to complete the setup.</p>
              <div style={{ display: "flex", gap: "8px", flexDirection: "column" }}>
                <input 
                  type="email" 
                  placeholder="Work email address" 
                  style={{
                    flex: 1,
                    padding: "10px 16px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-default)",
                    fontSize: "14px",
                    outline: "none",
                  }} 
                />
                <Button type="button" variant="secondary" style={{ width: "100%" }} onClick={() => {}}>
                  Send Invite
                </Button>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem", marginTop: "auto" }}>
              <button 
                type="button" 
                className="bob-link" 
                style={{ fontWeight: 700 }}
                onClick={() => navigate(AUTH_ROUTES.brandCentre)}
              >
                Skip for now
              </button>
              
              <div className="bob-trust-row" style={{ marginTop: 0, opacity: 0.6 }}>
                <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  <ShieldCheck size={14} />
                  Meta Tech Provider
                </span>
                <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  <Lock size={14} />
                  SSL Secure
                </span>
                <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  <CheckCircle2 size={14} />
                  GDPR Compliant
                </span>
              </div>
            </div>

          </div>
        </section>

        {/* Right Pane (Hidden on mobile) */}
        <section
          className="bob-verify__right bob-verify__right--desktop-only"
          aria-label="Dashboard Preview"
        >
          <div className="bob-verify__right-inner" style={{ textAlign: "center" }}>
            
            <div style={{ marginBottom: "2.5rem" }}>
              <div style={{ 
                display: "inline-flex", 
                alignItems: "center", 
                gap: "8px", 
                padding: "6px 16px", 
                background: "rgba(255,255,255,0.1)", 
                backdropFilter: "blur(12px)", 
                border: "1px solid rgba(52,211,153,0.3)", 
                borderRadius: "9999px",
                color: "var(--color-primary)",
                fontSize: "11px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
              }}>
                <Lock size={14} />
                API Connected: Creator Marketplace Unlocked
              </div>
            </div>

            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "32px", fontWeight: 700, color: "var(--color-primary)", margin: "0 0 2.5rem" }}>
              Dashboard Sneak-Peek
            </h2>

            {/* Dashboard Mockup */}
            <div style={{ 
              background: "rgba(255,255,255,0.05)", 
              backdropFilter: "blur(24px)", 
              borderRadius: "16px", 
              border: "1px solid rgba(255,255,255,0.1)", 
              padding: "24px", 
              textAlign: "left",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)"
            }}>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "16px", marginBottom: "24px" }}>
                <div style={{ display: "flex", gap: "6px" }}>
                  <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ef4444" }}></div>
                  <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#eab308" }}></div>
                  <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#22c55e" }}></div>
                </div>
                <div style={{ fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.2em" }}>
                  Global Analytics v5.0
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", height: "256px" }}>
                
                {/* Blur Box */}
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <p style={{ fontSize: "9px", fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", textAlign: "center", margin: 0 }}>
                    Estimated Engagement
                  </p>
                  <div style={{ 
                    flex: 1, 
                    background: "rgba(255,255,255,0.05)", 
                    borderRadius: "12px", 
                    border: "1px solid rgba(255,255,255,0.05)", 
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: 0.2,
                    filter: "blur(2px)"
                  }}>
                    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "12px", alignItems: "center" }}>
                      <div style={{ height: "6px", background: "rgba(255,255,255,0.1)", borderRadius: "999px", width: "75%" }}></div>
                      <div style={{ height: "6px", background: "rgba(255,255,255,0.1)", borderRadius: "999px", width: "50%" }}></div>
                      <div style={{ height: "6px", background: "rgba(255,255,255,0.1)", borderRadius: "999px", width: "66%" }}></div>
                      <div style={{ fontSize: "20px", fontWeight: 700, color: "rgba(255,255,255,0.2)", marginTop: "16px" }}>~42.5k</div>
                    </div>
                  </div>
                </div>

                {/* Clear Box */}
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <p style={{ fontSize: "9px", fontWeight: 700, color: "var(--color-primary)", textTransform: "uppercase", letterSpacing: "0.1em", textAlign: "center", margin: 0 }}>
                    Verified API Data
                  </p>
                  <div style={{ 
                    flex: 1, 
                    background: "rgba(52,211,153,0.05)", 
                    borderRadius: "12px", 
                    border: "1px solid rgba(52,211,153,0.4)", 
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: "0 0 30px rgba(52,211,153,0.15)"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontSize: "9px", color: "rgba(52,211,153,0.6)", fontWeight: 700, textTransform: "uppercase" }}>Accuracy Score</span>
                        <span style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-primary)" }}>Match: 98%</span>
                      </div>
                      <ShieldCheck size={20} style={{ color: "var(--color-primary)" }} />
                    </div>
                    
                    <div style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: "6px" }}>
                      <div style={{ flex: 1, background: "rgba(52,211,153,0.3)", borderRadius: "2px 2px 0 0", height: "35%" }}></div>
                      <div style={{ flex: 1, background: "rgba(52,211,153,0.5)", borderRadius: "2px 2px 0 0", height: "60%" }}></div>
                      <div style={{ flex: 1, background: "rgba(52,211,153,0.7)", borderRadius: "2px 2px 0 0", height: "50%" }}></div>
                      <div style={{ flex: 1, background: "var(--color-primary)", borderRadius: "2px 2px 0 0", height: "95%", boxShadow: "0 0 15px rgba(52,211,153,0.6)" }}></div>
                      <div style={{ flex: 1, background: "rgba(52,211,153,0.8)", borderRadius: "2px 2px 0 0", height: "70%" }}></div>
                    </div>

                    <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                       <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", fontWeight: 700, color: "rgba(52,211,153,0.7)" }}>
                         <span>REAL-TIME FEED</span>
                         <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                           <span style={{ width: "6px", height: "6px", background: "var(--color-primary)", borderRadius: "50%" }}></span> LIVE
                         </span>
                       </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer text */}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "32px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                <div>
                  <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", fontWeight: 700, textTransform: "uppercase", margin: 0 }}>Current Data Source</p>
                  <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.8)", fontWeight: 700, margin: 0 }}>Meta API Connection</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", fontWeight: 700, textTransform: "uppercase", margin: 0 }}>Latency</p>
                  <p style={{ fontSize: "13px", color: "var(--color-primary)", fontWeight: 700, margin: 0 }}>Real-time (0.4ms)</p>
                </div>
              </div>

            </div>

            {/* Glowing orbs background (optional decorative elements) */}
            <div style={{ position: "absolute", top: "0", left: "0", width: "100%", height: "100%", zIndex: -1, pointerEvents: "none", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: "-25%", right: "-25%", width: "100%", height: "100%", background: "rgba(52,211,153,0.1)", borderRadius: "50%", filter: "blur(150px)" }}></div>
              <div style={{ position: "absolute", bottom: "-25%", left: "-25%", width: "100%", height: "100%", background: "rgba(0,108,75,0.1)", borderRadius: "50%", filter: "blur(150px)" }}></div>
            </div>

          </div>
        </section>
      </div>
    </div>
  );
}
