import { Alert } from "../../../design-system/aurora";
import type { CoPilotUsageSnapshot } from "../contracts/co-pilot.contracts";

type Props = {
  usage: CoPilotUsageSnapshot | null;
};

export function CoPilotUsageBanner({ usage }: Props) {
  if (!usage || usage.warningLevel === "ok") {
    return null;
  }

  const tone =
    usage.warningLevel === "exhausted"
      ? "error"
      : usage.warningLevel === "critical"
        ? "error"
        : "warning";

  return (
    <Alert tone={tone} title="Co-pilot usage">
      {usage.warningMessage ??
        `${usage.current} of ${usage.limit} turns used this period.`}
    </Alert>
  );
}
