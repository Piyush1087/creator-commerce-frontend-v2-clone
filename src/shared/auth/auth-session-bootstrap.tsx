import { useEffect, type PropsWithChildren } from "react";

import { bootstrapAuthSession } from "./auth-session";

export function AuthSessionBootstrap({ children }: PropsWithChildren) {
  useEffect(() => {
    void bootstrapAuthSession();
  }, []);

  return children;
}
