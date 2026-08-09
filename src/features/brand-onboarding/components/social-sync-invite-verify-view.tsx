import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle } from "lucide-react";

import { Button, Card, TextField } from "../../../design-system/aurora";
import { env } from "../../../shared/config/env";
import { ONBOARDING_ROUTES } from "../constants";

/** Placeholder invitee OTP gate — Aurora card, no Stitch reference. */
export function SocialSyncInviteVerifyView() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") ?? "";
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Missing invitation token.");
      return;
    }
    void (async () => {
      try {
        const res = await fetch(
          `${env.apiUrl}/api/v1/brand/social-sync/invite/start?token=${encodeURIComponent(token)}`,
        );
        const json = (await res.json()) as { email?: string; message?: string };
        if (!res.ok) {
          throw new Error(json.message || "Invalid invitation.");
        }
        setEmail(json.email ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Invalid invitation.");
      }
    })();
  }, [token]);

  const verify = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${env.apiUrl}/api/v1/brand/social-sync/invite/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, otp }),
      });
      const json = (await res.json()) as { verified?: boolean; message?: string };
      if (!res.ok || !json.verified) {
        throw new Error(json.message || "Invalid or expired code.");
      }
      navigate(`${ONBOARDING_ROUTES.socialSync}?context=agent&token=${encodeURIComponent(token)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bob-verify bob-verify--hide-nav">
      <div className="bob-container" style={{ maxWidth: 480, margin: "4rem auto" }}>
        <Card className="bob-verify__card">
          <h1 className="bob-verify__title">Verify Your Access Request</h1>
          <p className="bob-verify__lead">
            For security, we&apos;ve dispatched a short-lived 6-digit OTP
            {email ? ` to ${email}` : ""}. Enter it below to open the Instagram sync channel.
          </p>
          <TextField
            label="OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value.slice(0, 6))}
            placeholder="6-digit code"
          />
          {error ? (
            <div className="bob-inline-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          ) : null}
          <Button
            type="button"
            variant="primary"
            fullWidthOnMobile
            disabled={busy || otp.length !== 6}
            onClick={() => void verify()}
          >
            Confirm Identity & Enter Sync
          </Button>
        </Card>
      </div>
    </div>
  );
}
