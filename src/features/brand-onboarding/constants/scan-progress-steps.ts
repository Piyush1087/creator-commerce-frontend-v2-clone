import type { ScanStep } from "../types";

/** Labels mapped to backend SurfaceScanProgressStore phases (Stitch copy). */
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
