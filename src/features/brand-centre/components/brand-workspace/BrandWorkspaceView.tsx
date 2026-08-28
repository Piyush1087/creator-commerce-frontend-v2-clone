import { Card } from "../../../../design-system/aurora";
import type { BrandWorkspaceView as WorkspaceView } from "../../adapters/map-brand-workspace";
import { BrandField } from "./BrandField";
import { BrandLocations } from "./BrandLocations";
import { BrandIdentity } from "./BrandIdentity";
import { BrandStory } from "./BrandStory";
import { BrandAudience } from "./BrandAudience";
import { BrandVisualAssets } from "./BrandVisualAssets";
import { BrandLearning } from "./BrandLearning";
import { isLearningGroup } from "./brand-learning-presentation";

const helpers: Record<string, string> = {
  story:
    "How Creator Shop understands what your Brand stands for and what makes it relevant.",
  communication:
    "The communication character and boundaries Creator Shop can carry into future creator work.",
  audience:
    "The audience groups Creator Shop currently believes matter most for creator strategy.",
  visual:
    "Your Brand assets and the visual patterns Creator Shop can reliably carry into creator work.",
};

export function BrandWorkspaceView({ view }: { view: WorkspaceView }) {
  const initialLearning =
    view.runtimeActivity === "LEARNING" &&
    view.sections
      .filter((section) =>
        ["story", "communication", "audience", "serviceability"].includes(
          section.id,
        ),
      )
      .every((section) => isLearningGroup(section.nodes));
  const logo = view.sections
    .find((section) => section.id === "visual")
    ?.nodes[0]?.children?.find((node) => node.id === "primary_logo");
  return (
    <div
      className="brand-workspace-content"
      data-workspace-readiness={view.readiness}
    >
      {view.sections.map((section) => (
        <div
          key={section.id}
          data-brand-section={section.id}
          className={`brand-workspace-section brand-workspace-section--${section.id}`}
        >
          {section.id === "identity" ? (
            <>
              <BrandIdentity nodes={section.nodes} logo={logo} />
              {initialLearning ? (
                <div className="brand-learning-orientation">
                  <h2>We're building a deeper understanding of your brand.</h2>
                  <p>
                    Creator Shop is continuing to learn from your Brand
                    information. You can start here now — more useful detail
                    will appear as it becomes grounded enough to use.
                  </p>
                </div>
              ) : null}
            </>
          ) : (
            <>
              <header className="brand-workspace-section__header">
                <h2>{section.title}</h2>
                {helpers[section.id] ? <p>{helpers[section.id]}</p> : null}
              </header>
              {section.id !== "locations" &&
              section.id !== "visual" &&
              isLearningGroup(section.nodes) ? (
                <BrandLearning area={section.id} />
              ) : section.id === "story" ? (
                <BrandStory nodes={section.nodes} />
              ) : section.id === "audience" ? (
                section.nodes.map((node) => (
                  <BrandAudience key={node.id} node={node} />
                ))
              ) : section.id === "visual" ? (
                <div className="brand-visual">
                  {section.nodes.map((node) => (
                    <Card
                      key={node.id}
                      className={
                        node.id === "canonical-brand-assets"
                          ? "brand-visual__assets"
                          : "brand-visual__interpretation"
                      }
                    >
                      {node.id === "canonical-brand-assets" ? (
                        <BrandVisualAssets node={node} />
                      ) : isLearningGroup([node]) ? (
                        <>
                          <h3>{node.label}</h3>
                          <BrandLearning area="visual" />
                        </>
                      ) : (
                        <BrandField node={node} />
                      )}
                    </Card>
                  ))}
                </div>
              ) : (
                <Card
                  className={`brand-workspace-surface brand-workspace-surface--${section.id}`}
                >
                  {section.id === "locations" ? (
                    <BrandLocations locations={view.locations} />
                  ) : (
                    section.nodes.map((node) => (
                      <BrandField key={node.id} node={node} />
                    ))
                  )}
                </Card>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
}
