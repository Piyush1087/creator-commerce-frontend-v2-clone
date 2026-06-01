import { Instagram, Play } from "lucide-react";
import { SideDrawer } from "../../../design-system/aurora/components/SideDrawer";
import { Button } from "../../../design-system/aurora/components/Button";

const CREATOR_IMG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBhPsy4KMWgRB56itgMD0L96klzBRSqD5ud_llppR_EM57AH7qTm72xy6grORo3bbiQo2Isy8IVGvBcNCDaL641fIHvzNy1e4ttqCIcU5aidY85uAKz0qy5aKfwJUnmd3sm_5agt2prLtfsVXxQgbGk6hBWS3BFRFQNiz213M5PuYraXhjh_UXA6T5Mx6jpvw8-WDARDaBfcInPTd4b4-2qgRDiQTO_nfrHxHJn02bdJLuh37I_UvamAjHBD8ZpcMgO0CCj9TH_BQ";

type ApplicantVettingDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  instagramHandle: string;
};

export function ApplicantVettingDrawer({
  isOpen,
  onClose,
  instagramHandle,
}: ApplicantVettingDrawerProps) {
  return (
    <SideDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={instagramHandle}
      subtitle="Instagram Connected Profile"
      width="480px"
      footer={
        <div className="uce-vetting-footer">
          <Button variant="primary" className="uce-drawer-footer-full">
            Approve &amp; Advance to Active Collabs
          </Button>
          <div className="uce-vetting-footer-row">
            <Button variant="outline" className="uce-vetting-footer-half">
              Decline Application
            </Button>
            <Button variant="ghost" className="uce-vetting-footer-half">
              <Instagram size={16} />
              View on Instagram
            </Button>
          </div>
        </div>
      }
    >
      <div className="uce-vetting-drawer">
        <p className="uce-vetting-target-line">
          Campaign Product Target:{" "}
          <strong>Glow Serum Premium V2</strong> | Assigned Brief Frame:{" "}
          <strong>Summer Solstice Core</strong>
        </p>

        <section className="uce-vetting-section">
          <div className="uce-vetting-section-head">
            <h3>AI Evaluation Summary</h3>
            <span className="uce-fit-pill">89% Target Fit Grade</span>
          </div>
          <div className="uce-recommendation-badge">Strong Advance Recommendation</div>
          <p className="uce-ai-diagnostics">
            High visual alignment with &quot;Minimalist Editorial&quot; pillar. Warm lighting
            and consistent aesthetic patterns detected across recent native content.
          </p>
        </section>

        <section className="uce-vetting-section">
          <h3>Account Metrics &amp; AI Insights</h3>
          <div className="uce-insight-callout">
            Inside Track: Exceptionally high saves-to-likes ratio — strong audience conversion
            and intent hook potential.
          </div>
          <div className="uce-metrics-card">
            <div className="uce-metrics-top">
              <div>
                <span>Followers</span>
                <strong>142k</strong>
              </div>
              <div>
                <span>Engagement</span>
                <strong>4.2%</strong>
              </div>
              <div>
                <span>Authenticity</span>
                <strong>91% Real</strong>
              </div>
            </div>
            <div className="uce-metrics-bottom">
              <div>
                <span>Avg Likes</span>
                <strong>5.8k</strong>
              </div>
              <div>
                <span>Avg Views</span>
                <strong>24k</strong>
              </div>
              <div>
                <span>Avg Shares</span>
                <strong>380</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="uce-vetting-section">
          <h3>Recent Native Content Portfolio (9:16)</h3>
          <div className="uce-portfolio-grid">
            {[14.2, 10.8, 21.5].map((views) => (
              <div key={views} className="uce-portfolio-tile">
                <img src={CREATOR_IMG} alt="" />
                <span className="uce-portfolio-play">
                  <Play size={14} fill="currentColor" />
                  {views}k
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </SideDrawer>
  );
}
