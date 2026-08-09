import { useEffect, useRef, useState } from "react";

import { Chip } from "../../../design-system/aurora";
import type { CoPilotIntentTemplate } from "../types";

const VISIBLE_CHIP_COUNT = 4;

type Props = {
  templates: CoPilotIntentTemplate[];
  onSelect: (template: CoPilotIntentTemplate) => void;
  disabled?: boolean;
  /** Start collapsed behind “Show suggestions” (mobile sheet). */
  collapseByDefault?: boolean;
  /** When this value changes (e.g. after a user send), collapse suggestions. */
  collapseSignal?: number | string;
};

export function CoPilotIntentChips({
  templates,
  onSelect,
  disabled = false,
  collapseByDefault = false,
  collapseSignal,
}: Props) {
  const [panelOpen, setPanelOpen] = useState(!collapseByDefault);
  const [showAll, setShowAll] = useState(false);
  const prevSignalRef = useRef<number | string | undefined>(undefined);

  useEffect(() => {
    if (collapseSignal === undefined) {
      return;
    }
    if (prevSignalRef.current === undefined) {
      prevSignalRef.current = collapseSignal;
      return;
    }
    if (prevSignalRef.current === collapseSignal) {
      return;
    }
    prevSignalRef.current = collapseSignal;
    setPanelOpen(false);
    setShowAll(false);
  }, [collapseSignal]);

  if (templates.length === 0) {
    return null;
  }

  if (!panelOpen) {
    return (
      <div className="co-pilot-intent-chips co-pilot-intent-chips--collapsed">
        <button
          type="button"
          className="co-pilot-intent-chips__toggle"
          disabled={disabled}
          onClick={() => setPanelOpen(true)}
        >
          Show suggestions
        </button>
      </div>
    );
  }

  const hasOverflow = templates.length > VISIBLE_CHIP_COUNT;
  const visibleTemplates =
    showAll || !hasOverflow
      ? templates
      : templates.slice(0, VISIBLE_CHIP_COUNT);

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
      {hasOverflow && !showAll ? (
        <Chip
          tone="neutral"
          className="co-pilot-intent-chips__chip co-pilot-intent-chips__chip--more"
          disabled={disabled}
          onClick={() => {
            if (!disabled) {
              setShowAll(true);
            }
          }}
        >
          Show more
        </Chip>
      ) : null}
      {hasOverflow && showAll ? (
        <Chip
          tone="neutral"
          className="co-pilot-intent-chips__chip co-pilot-intent-chips__chip--more"
          disabled={disabled}
          onClick={() => {
            if (!disabled) {
              setShowAll(false);
            }
          }}
        >
          Show less
        </Chip>
      ) : null}
      <button
        type="button"
        className="co-pilot-intent-chips__toggle co-pilot-intent-chips__toggle--hide"
        disabled={disabled}
        onClick={() => {
          setPanelOpen(false);
          setShowAll(false);
        }}
      >
        Hide
      </button>
    </div>
  );
}
