import { Loader2 } from "lucide-react";

import { Alert } from "../../../design-system/aurora";

type DeepScanStatusBannerProps = {
  scanStatus: string | null;
  jobStatus: string | null;
};

export function DeepScanStatusBanner({
  scanStatus,
  jobStatus,
}: DeepScanStatusBannerProps) {
  const detail =
    jobStatus === "RUNNING"
      ? "Our AI is enriching your brand profile, budget mixes, and strategic DNA."
      : "Your deep scan is queued. This usually takes a few minutes after email verification.";

  return (
    <div className="brand-centre-deep-scan-banner">
      <Alert tone="warning" title="Deep scan in progress">
        <span className="brand-centre-deep-scan-banner__body">
          <Loader2
            size={16}
            className="brand-centre-deep-scan-banner__spinner"
            aria-hidden
          />
          <span>
            {detail} Fields marked with placeholders will fill in when the scan
            completes ({scanStatus ?? "DEEP_SCAN_IN_PROGRESS"}).
          </span>
        </span>
      </Alert>
    </div>
  );
}
