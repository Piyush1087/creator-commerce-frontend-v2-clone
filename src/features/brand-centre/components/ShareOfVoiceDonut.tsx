import { EMPTY_FIELD } from "../utils/display-field";

const DONUT_RADIUS = 38;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

const SOV_SEGMENTS = [
  { key: "brand", label: "Our Brand", color: "var(--color-primary)" },
  { key: "competitorA", label: "Competitor A", color: "#34D399" },
  { key: "competitorB", label: "Competitor B", color: "#EF4444" },
  { key: "others", label: "Others", color: "#94A3B8" },
] as const;

type ShareOfVoiceData = {
  brand?: number | null;
  competitorA?: number | null;
  competitorB?: number | null;
  others?: number | null;
};

type ShareOfVoiceDonutProps = {
  shareOfVoice?: ShareOfVoiceData | null;
};

export function ShareOfVoiceDonut({ shareOfVoice }: ShareOfVoiceDonutProps) {
  const slices = SOV_SEGMENTS.map((segment) => ({
    ...segment,
    value: shareOfVoice?.[segment.key] ?? null,
  }));

  const chartSlices = slices.filter(
    (slice): slice is typeof slice & { value: number } =>
      slice.value != null && slice.value > 0,
  );
  const chartTotal = chartSlices.reduce((sum, slice) => sum + slice.value, 0);
  const hasChartData = chartTotal > 0;

  let arcOffset = 0;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "16px",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "140px",
          height: "140px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          style={{ transform: "rotate(-90deg)", width: "100%", height: "100%" }}
          viewBox="0 0 100 100"
          aria-hidden
        >
          <circle
            cx="50"
            cy="50"
            r={DONUT_RADIUS}
            fill="transparent"
            stroke="var(--surface-container-highest, #E5E7EB)"
            strokeWidth="12"
          />
          {hasChartData
            ? chartSlices.map((slice) => {
                const arcLength = (slice.value / chartTotal) * DONUT_CIRCUMFERENCE;
                const segment = (
                  <circle
                    key={slice.key}
                    cx="50"
                    cy="50"
                    r={DONUT_RADIUS}
                    fill="transparent"
                    stroke={slice.color}
                    strokeWidth="12"
                    strokeDasharray={`${arcLength} ${DONUT_CIRCUMFERENCE}`}
                    strokeDashoffset={-arcOffset}
                    strokeLinecap="butt"
                  />
                );
                arcOffset += arcLength;
                return segment;
              })
            : null}
        </svg>
        <span
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            fontSize: "18px",
            fontWeight: 700,
            textAlign: "center",
            lineHeight: 1.2,
            padding: "0 12px",
          }}
        >
          {shareOfVoice?.brand != null ? `${shareOfVoice.brand}%` : EMPTY_FIELD}
        </span>
      </div>

      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        {slices.map((slice) => (
          <div
            key={slice.key}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "12px",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: slice.color,
                  flexShrink: 0,
                }}
              />
              {slice.label}
            </span>
            <span style={{ fontWeight: 700 }}>
              {slice.value != null ? `${slice.value}%` : EMPTY_FIELD}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
