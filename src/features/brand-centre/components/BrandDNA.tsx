import { Edit2, ExternalLink, Camera, PlayCircle, Music, ChevronRight } from "lucide-react";

import type { BrandCentreViewModel } from "../types";
import { EMPTY_FIELD, hasDisplayValue } from "../utils/display-field";

interface BrandDNAProps {
  data: BrandCentreViewModel;
}

function SocialIcon({
  handle,
  icon: Icon,
}: {
  handle: string;
  icon: typeof Camera;
}) {
  const active = hasDisplayValue(handle);
  return (
    <span
      title={active ? handle : undefined}
      style={{
        opacity: active ? 1 : 0.35,
        display: "inline-flex",
      }}
    >
      <Icon size={20} />
    </span>
  );
}

export function BrandDNA({ data }: BrandDNAProps) {
  const websiteHref =
    data.websiteUrl && hasDisplayValue(data.website) ? data.websiteUrl : null;

  return (
    <div className="aurora-card" style={{ padding: 0, overflow: "hidden" }}>
      <div
        style={{
          padding: "24px",
          borderBottom: "1px solid var(--border-default)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2 style={{ fontSize: "20px", fontWeight: 700, margin: 0 }}>
          Brand DNA
        </h2>
      </div>

      <div style={{ padding: "24px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "32px",
            borderBottom: "1px solid var(--border-default)",
            paddingBottom: "32px",
            marginBottom: "32px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <h3
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Brand Profile
              </h3>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  className="aurora-header__btn"
                  style={{ width: "32px", height: "32px" }}
                  aria-label="Edit profile"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  type="button"
                  className="aurora-header__btn"
                  style={{ width: "32px", height: "32px" }}
                  aria-label="Open public profile"
                  disabled={!websiteHref}
                >
                  <ExternalLink size={14} />
                </button>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: "96px",
                  height: "96px",
                  borderRadius: "50%",
                  background: "var(--surface-page)",
                  border: "1px solid var(--border-default)",
                  marginBottom: "16px",
                  overflow: "hidden",
                  display: "grid",
                  placeItems: "center",
                  fontSize: "28px",
                  fontWeight: 700,
                  color: "var(--text-muted)",
                }}
              >
                {data.logoUrl ? (
                  <img
                    src={data.logoUrl}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  (hasDisplayValue(data.brandName)
                    ? data.brandName.charAt(0).toUpperCase()
                    : EMPTY_FIELD)
                )}
              </div>
              <h4 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 4px 0" }}>
                {data.brandName}
              </h4>
              {websiteHref ? (
                <a
                  href={websiteHref}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    color: "var(--color-primary)",
                    fontSize: "14px",
                    fontWeight: 600,
                    textDecoration: "none",
                    marginBottom: "12px",
                  }}
                >
                  {data.website}
                </a>
              ) : (
                <p
                  style={{
                    color: "var(--text-muted)",
                    fontSize: "14px",
                    fontWeight: 600,
                    margin: "0 0 12px 0",
                  }}
                >
                  {data.website}
                </p>
              )}
              <div
                style={{
                  display: "flex",
                  gap: "16px",
                  color: "var(--text-muted)",
                }}
              >
                <SocialIcon handle={data.igHandle} icon={Camera} />
                <SocialIcon handle={data.ytHandle} icon={PlayCircle} />
                <SocialIcon handle={data.tiktokHandle} icon={Music} />
              </div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
              gap: "24px",
              alignItems: "center",
            }}
          >
            <div>
              <p
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  margin: "0 0 4px 0",
                }}
              >
                Market Setup
              </p>
              <p style={{ fontSize: "14px", fontWeight: 600, margin: 0 }}>
                {data.marketSetup}
              </p>
            </div>
            <div>
              <p
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  margin: "0 0 4px 0",
                }}
              >
                Industry
              </p>
              <p style={{ fontSize: "14px", fontWeight: 600, margin: 0 }}>
                {data.industry}
              </p>
            </div>
            <div>
              <p
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  margin: "0 0 4px 0",
                }}
              >
                Lifecycle Stage
              </p>
              <p style={{ fontSize: "14px", fontWeight: 600, margin: 0, color: "var(--color-primary)" }}>
                {data.lifecycleStage}
              </p>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            borderBottom: "1px solid var(--border-default)",
            paddingBottom: "32px",
            marginBottom: "32px",
          }}
        >
          <h3
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Brand Narrative
          </h3>
          <div style={{ maxWidth: "800px" }}>
            <h4 style={{ fontSize: "20px", fontWeight: 800, margin: "0 0 12px 0", color: "var(--text-high)" }}>
              {hasDisplayValue(data.narrativeTitle)
                ? `"${data.narrativeTitle}"`
                : EMPTY_FIELD}
            </h4>
            <p
              style={{
                fontSize: "14px",
                color: "var(--text-muted)",
                lineHeight: 1.6,
                margin: "0 0 24px 0",
              }}
            >
              {data.narrativeDescription}
            </p>
            <button
              type="button"
              style={{
                background: "var(--surface-container-low)",
                border: "1px solid var(--border-default)",
                padding: "8px 16px",
                borderRadius: "8px",
                color: "var(--color-primary)",
                fontWeight: 700,
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
              }}
            >
              View More Details <ChevronRight size={14} />
            </button>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <h3
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Aesthetics & Audience
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "32px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <p style={{ fontSize: "13px", fontWeight: 700, margin: 0 }}>
                Visual Identity
              </p>
              {data.colors.length > 0 ? (
                <div style={{ display: "flex", gap: "12px" }}>
                  {data.colors.map((color) => (
                    <div
                      key={color}
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        border: "1px solid var(--border-default)",
                        background: color,
                      }}
                    />
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
                  {EMPTY_FIELD}
                </p>
              )}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {data.fonts.map((font) => (
                  <div
                    key={font}
                    style={{
                      background: "var(--surface-page)",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      fontSize: "11px",
                      fontWeight: 600,
                      border: "1px solid var(--border-default)"
                    }}
                  >
                    {font}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <p style={{ fontSize: "13px", fontWeight: 700, margin: 0 }}>
                Tone & Presence
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {data.toneTags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      background: "rgba(52, 211, 153, 0.1)",
                      color: "var(--color-primary)",
                      padding: "4px 12px",
                      borderRadius: "100px",
                      fontSize: "11px",
                      fontWeight: 700,
                      border: "1px solid rgba(52, 211, 153, 0.2)",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <p style={{ fontSize: "13px", fontWeight: 700, margin: 0 }}>
                Core Personas
              </p>
              <div
                style={{
                  display: "flex",
                  overflowX: "auto",
                  gap: "16px",
                  paddingBottom: "8px",
                }}
              >
                {data.personas.map((persona) => (
                  <div
                    key={persona.name}
                    style={{
                      minWidth: "220px",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      background: "white",
                      border: "1px solid var(--border-default)",
                      padding: "12px",
                      borderRadius: "12px",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
                    }}
                  >
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "12px",
                        overflow: "hidden",
                        background: "var(--primary-container)",
                        display: "grid",
                        placeItems: "center",
                        fontSize: "14px",
                        fontWeight: 800,
                        color: "var(--on-primary-container)",
                      }}
                    >
                      {hasDisplayValue(persona.name)
                        ? persona.name.charAt(0).toUpperCase()
                        : EMPTY_FIELD}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 700 }}>
                        {persona.name}
                      </span>
                      <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                        AI-Calculated
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
