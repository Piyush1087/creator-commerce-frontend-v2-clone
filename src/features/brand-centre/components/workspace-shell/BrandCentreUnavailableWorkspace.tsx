type BrandCentreUnavailableWorkspaceProps = {
  title: "Overview" | "Market" | "Recommendations";
};

export function BrandCentreUnavailableWorkspace({
  title,
}: BrandCentreUnavailableWorkspaceProps) {
  return (
    <main className="brand-centre-unavailable-workspace">
      <h1>{title}</h1>
      <p>This workspace is not available yet.</p>
    </main>
  );
}
