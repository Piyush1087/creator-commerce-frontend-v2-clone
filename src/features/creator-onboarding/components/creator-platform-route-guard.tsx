import { useCallback, useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";

import { Button } from "../../../design-system/aurora";
import { useAuthSession } from "../../../shared/auth/use-auth-session";
import { fetchCreatorEntryState } from "../api/creator-entry-client";

export function RequireCreatorPlatformAccess() {
  const session = useAuthSession();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [failed, setFailed] = useState(false);

  const check = useCallback(async () => {
    setFailed(false);
    setAllowed(null);
    try {
      const state = await fetchCreatorEntryState();
      setAllowed(
        session.currentUser?.role === "CREATOR" &&
          state.canEnterCreatorPlatform,
      );
    } catch {
      setFailed(true);
    }
  }, [session.currentUser?.role]);

  useEffect(() => {
    void check();
  }, [check]);

  if (failed)
    return (
      <div role="alert">
        <p>Creator access could not be verified.</p>
        <Button onClick={() => void check()}>Try again</Button>
      </div>
    );
  if (allowed === null)
    return (
      <p role="status" aria-busy="true">
        Verifying Creator platform access…
      </p>
    );
  return allowed ? <Outlet /> : <Navigate to="/creator/onboarding" replace />;
}
