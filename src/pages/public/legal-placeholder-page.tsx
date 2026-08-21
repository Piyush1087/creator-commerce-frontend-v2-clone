type LegalPlaceholderPageProps = {
  title: string;
};

export function LegalPlaceholderPage({ title }: LegalPlaceholderPageProps) {
  return (
    <main
      style={{
        maxWidth: 760,
        margin: "0 auto",
        padding: "48px 24px 72px",
        color: "var(--text-high, #0e1214)",
      }}
    >
      <p
        style={{
          margin: "0 0 8px",
          color: "var(--text-muted, #6b7280)",
          fontSize: 13,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: ".04em",
        }}
      >
        Draft placeholder
      </p>
      <h1 style={{ margin: "0 0 16px", fontSize: "var(--size-h1, 32px)" }}>
        {title}
      </h1>
      <p style={{ margin: 0, color: "var(--text-muted, #6b7280)", lineHeight: 1.6 }}>
        The formal {title.toLowerCase()} is being prepared. This temporary page exists so
        the Gatekeeper onboarding consent links have a valid destination during MVP
        development and testing.
      </p>
    </main>
  );
}
