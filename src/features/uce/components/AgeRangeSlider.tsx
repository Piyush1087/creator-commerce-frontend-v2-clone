import "./AgeRangeSlider.css";

export const AUDIENCE_AGE_MIN_LIMIT = 18;
export const AUDIENCE_AGE_MAX_LIMIT = 65;

type AgeRangeSliderProps = {
  min: number;
  max: number;
  onChange: (min: number, max: number) => void;
};

export function AgeRangeSlider({ min, max, onChange }: AgeRangeSliderProps) {
  const span = AUDIENCE_AGE_MAX_LIMIT - AUDIENCE_AGE_MIN_LIMIT;
  const fillLeft = ((min - AUDIENCE_AGE_MIN_LIMIT) / span) * 100;
  const fillRight = ((AUDIENCE_AGE_MAX_LIMIT - max) / span) * 100;

  const handleMinChange = (raw: number) => {
    const nextMin = Math.max(
      AUDIENCE_AGE_MIN_LIMIT,
      Math.min(raw, max),
    );
    onChange(nextMin, max);
  };

  const handleMaxChange = (raw: number) => {
    const nextMax = Math.min(
      AUDIENCE_AGE_MAX_LIMIT,
      Math.max(raw, min),
    );
    onChange(min, nextMax);
  };

  return (
    <div className="cw-age-range">
      <div className="cw-age-range__value-row">
        <span className="cw-age-range__value">
          {min} — {max}
        </span>
        <span className="cw-age-range__bounds">
          {AUDIENCE_AGE_MIN_LIMIT}–{AUDIENCE_AGE_MAX_LIMIT}
        </span>
      </div>

      <div className="cw-age-range__track-wrap">
        <div className="cw-age-range__track" aria-hidden />
        <div
          className="cw-age-range__fill"
          style={{ left: `${fillLeft}%`, right: `${fillRight}%` }}
          aria-hidden
        />
        <input
          type="range"
          className="cw-age-range__input cw-age-range__input--min"
          min={AUDIENCE_AGE_MIN_LIMIT}
          max={AUDIENCE_AGE_MAX_LIMIT}
          value={min}
          aria-label="Minimum audience age"
          onChange={(e) => handleMinChange(Number(e.target.value))}
        />
        <input
          type="range"
          className="cw-age-range__input cw-age-range__input--max"
          min={AUDIENCE_AGE_MIN_LIMIT}
          max={AUDIENCE_AGE_MAX_LIMIT}
          value={max}
          aria-label="Maximum audience age"
          onChange={(e) => handleMaxChange(Number(e.target.value))}
        />
      </div>

      <div className="cw-age-range__ticks" aria-hidden>
        <span>{AUDIENCE_AGE_MIN_LIMIT}</span>
        <span>{AUDIENCE_AGE_MAX_LIMIT}</span>
      </div>
    </div>
  );
}
