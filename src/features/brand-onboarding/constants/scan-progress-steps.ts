import type { ScanStep } from "../types";

/** Labels mapped to backend SurfaceScanProgressStore phases (desktop/mobile overlay refs). */
export const SCAN_PROGRESS_STEPS: ScanStep[] = [
  {
    id: "signals",
    label: "Reading brand signals",
    subtext: "Crawling typography and colors...",
  },
  {
    id: "products",
    label: "Identifying products & positioning",
    subtext: "Extracting value propositions...",
  },
  {
    id: "audience",
    label: "Understanding audience fit",
    subtext: "Profiling buyer personas...",
  },
  {
    id: "competitors",
    label: "Detecting competitors",
    subtext: "Finding similar brands in market...",
  },
];
