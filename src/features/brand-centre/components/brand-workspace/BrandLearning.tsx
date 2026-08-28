const copy = {
  story: [
    "We're developing a clearer view of your Brand.",
    "As Creator Shop establishes your positioning, value proposition and differentiation, the strongest grounded understanding will appear here.",
  ],
  communication: [
    "We're still learning how your Brand communicates.",
    "Tone, communication guidance and important boundaries will appear here as Creator Shop establishes them.",
  ],
  audience: [
    "Creator Shop is still learning your audience.",
    "We'll show the audience groups that matter most for creator strategy once there is enough grounded information to make them useful.",
  ],
  visual: [
    "We're still developing a clearer picture of your visual style.",
    "More visual patterns will appear here once Creator Shop has enough grounded Brand material to interpret them reliably.",
  ],
  serviceability: [
    "We're still building a clearer picture of where this Brand can serve customers.",
    "Supported coverage will appear here as Creator Shop establishes reliable Brand, location and Offering information.",
  ],
} as const;

export function BrandLearning({ area }: { area: keyof typeof copy }) {
  return (
    <div
      className={`brand-learning brand-learning--${area}`}
      data-learning-area={area}
    >
      <p className="brand-learning__title">{copy[area][0]}</p>
      <p>{copy[area][1]}</p>
    </div>
  );
}
