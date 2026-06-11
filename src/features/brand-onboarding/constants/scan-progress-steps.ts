import type { ScanStep } from "../types";

/** UI-only labels for the surface-scan progress animation (not sample brand data). */
export const SCAN_PROGRESS_STEPS: ScanStep[] = [
  {
    id: "signals",
    label: "Reading brand signals",
    subtext: "Parsing visual identity & tone",
  },
  {
    id: "products",
    label: "Identifying products & positioning",
    subtext: "Mapping your product catalogue",
  },
  {
    id: "audience",
    label: "Understanding audience fit",
    subtext: "Profiling buyer personas",
  },
  {
    id: "competitors",
    label: "Detecting competitors",
    subtext: "Finding similar brands in market",
  },
];
