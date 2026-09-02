import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Alert,
  Badge,
  Button,
  SideDrawer,
  TextField,
} from "../../../../design-system/aurora";
import {
  changePassword,
  fetchAuthMe,
  logoutAllSessions,
} from "../../../auth/api/auth-client";
import { AUTH_ROUTES } from "../../../auth/constants";
import type {
  AuthMeResponseBody,
  AuthMethodType,
} from "../../../auth/contracts/auth.contracts";
import { SettingsSectionCard } from "../settings-section-card";

const METHOD_LABELS: Record<AuthMethodType, string> = {
  PASSWORD: "Password",
  GOOGLE: "Google",
  EMAIL_OTP: "Email code",
};

type SecurityAction = "change-password" | "logout-all" | null;

export function AccountSecuritySettings() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<AuthMeResponseBody | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [action, setAction] = useState<SecurityAction>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void fetchAuthMe()
      .then((value) => {
        if (active) setProfile(value);
      })
      .catch((error: unknown) => {
        if (active) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Sign-in methods are unavailable right now.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const closeAction = () => {
    if (busy) return;
    setAction(null);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setActionError(null);
  };

  const submitPasswordChange = async () => {
    setActionError(null);
    if (!currentPassword) {
      setActionError("Enter your current password.");
      return;
    }
    if (newPassword.length < 8 || newPassword.length > 128) {
      setActionError("Use a new password between 8 and 128 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setActionError("The new passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      navigate(AUTH_ROUTES.login, {
        replace: true,
        state: { accountSecurity: "PASSWORD_CHANGED" },
      });
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Your password could not be changed.",
      );
    } finally {
      setBusy(false);
    }
  };

  const submitLogoutAll = async () => {
    setBusy(true);
    setActionError(null);
    try {
      await logoutAllSessions();
      navigate(AUTH_ROUTES.login, {
        replace: true,
        state: { accountSecurity: "SIGNED_OUT_ALL" },
      });
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Could not sign out all devices.",
      );
    } finally {
      setBusy(false);
    }
  };

  const hasPassword =
    profile?.authMethods.some((method) => method.type === "PASSWORD") ?? false;

  return (
    <SettingsSectionCard
      title="Account security"
      description="Review how you sign in and end Creator Shop sessions across your devices."
    >
      {loading ? <p role="status">Loading sign-in methods…</p> : null}
      {loadError ? (
        <Alert tone="error" title="Could not load sign-in methods">
          {loadError}
        </Alert>
      ) : null}
      {profile ? (
        <div className="settings-security__methods">
          <h3>Sign-in methods</h3>
          <ul className="settings-security__method-list">
            {profile.authMethods.map((method) => (
              <li key={method.type}>
                <span>{METHOD_LABELS[method.type]}</span>
                <Badge tone="success">Active</Badge>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="settings-security__actions">
        {hasPassword ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setActionError(null);
              setAction("change-password");
            }}
          >
            Change password
          </Button>
        ) : null}
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setActionError(null);
            setAction("logout-all");
          }}
        >
          Sign out all devices
        </Button>
      </div>

      <SideDrawer
        isOpen={action !== null}
        onClose={closeAction}
        closeLabel="Close account security action"
        title={
          action === "change-password"
            ? "Change password"
            : "Sign out all devices"
        }
        subtitle={
          action === "change-password"
            ? "Changing your password ends active Creator Shop sessions."
            : "Confirm this session-wide security action."
        }
        width="460px"
        footer={
          <div className="settings-drawer-footer">
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              onClick={closeAction}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="account-security-action"
              disabled={busy}
            >
              {busy
                ? "Working…"
                : action === "change-password"
                  ? "Change password"
                  : "Sign out all devices"}
            </Button>
          </div>
        }
      >
        <form
          id="account-security-action"
          className="settings-drawer-body"
          onSubmit={(event) => {
            event.preventDefault();
            if (action === "change-password") {
              void submitPasswordChange();
            } else if (action === "logout-all") {
              void submitLogoutAll();
            }
          }}
        >
          {actionError ? (
            <div role="alert">
              <Alert tone="error" title="Account security action failed">
                {actionError}
              </Alert>
            </div>
          ) : null}
          {action === "change-password" ? (
            <>
              <TextField
                label="Current password"
                type="password"
                autoComplete="current-password"
                required
                disabled={busy}
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
              />
              <TextField
                label="New password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
                required
                disabled={busy}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
              />
              <TextField
                label="Confirm new password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
                required
                disabled={busy}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            </>
          ) : (
            <Alert tone="warning" title="End every Creator Shop session?">
              This signs you out of Creator Shop sessions on all devices. It
              does not sign you out of Google, Meta, or other providers.
            </Alert>
          )}
        </form>
      </SideDrawer>
    </SettingsSectionCard>
  );
}
