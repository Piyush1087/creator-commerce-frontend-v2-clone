import { useState } from "react";

import { Chip } from "../../../design-system/aurora";
import type { CoPilotIntentTemplate } from "../types";

const VISIBLE_CHIP_COUNT = 4;

type Props = {
  templates: CoPilotIntentTemplate[];
  onSelect: (template: CoPilotIntentTemplate) => void;
  disabled?: boolean;
  /** Mobile: hidden until user taps Show suggestions */
  collapseByDefault?: boolean;
};

export function CoPilotIntentChips({
  templates,
  onSelect,
  disabled = false,
  collapseByDefault = false,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const hasOverflow = templates.length > VISIBLE_CHIP_COUNT;
  const showAllChips = expanded || !hasOverflow || collapseByDefault;
  const visibleTemplates = showAllChips
    ? templates
    : templates.slice(0, VISIBLE_CHIP_COUNT);

  if (templates.length === 0) {
    return null;
  }

  if (collapseByDefault && !expanded) {
    return (
      <div className="co-pilot-intent-chips co-pilot-intent-chips--collapsed">
        <button
          type="button"
          className="co-pilot-intent-chips__toggle"
          disabled={disabled}
          onClick={() => setExpanded(true)}
        >
          Show suggestions
        </button>
      </div>
    );
  }

  return (
    <div
      className={`co-pilot-intent-chips${disabled ? " co-pilot-intent-chips--disabled" : ""}`}
    >
      {visibleTemplates.map((template) => (
        <Chip
          key={template.id}
          tone="neutral"
          className="co-pilot-intent-chips__chip"
          disabled={disabled}
          onClick={() => {
            if (!disabled) {
              onSelect(template);
            }
          }}
        >
          {template.label}
        </Chip>
      ))}
      {!collapseByDefault && hasOverflow && !expanded ? (
        <Chip
          tone="neutral"
          className="co-pilot-intent-chips__chip co-pilot-intent-chips__chip--more"
          disabled={disabled}
          onClick={() => {
            if (!disabled) {
              setExpanded(true);
            }
          }}
        >
          More suggestions
        </Chip>
      ) : null}
      {collapseByDefault && expanded ? (
        <button
          type="button"
          className="co-pilot-intent-chips__toggle co-pilot-intent-chips__toggle--hide"
          disabled={disabled}
          onClick={() => setExpanded(false)}
        >
          Hide suggestions
        </button>
      ) : null}
      {!collapseByDefault && hasOverflow && expanded ? (
        <Chip
          tone="neutral"
          className="co-pilot-intent-chips__chip co-pilot-intent-chips__chip--more"
          disabled={disabled}
          onClick={() => {
            if (!disabled) {
              setExpanded(false);
            }
          }}
        >
          Fewer suggestions
        </Chip>
      ) : null}
    </div>
  );
}
