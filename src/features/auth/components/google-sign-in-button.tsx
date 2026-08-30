import { useEffect, useRef, useState } from "react";

import { mountGoogleIdButton } from "../../brand-onboarding/utils/google-id-token";

type GoogleSignInButtonProps = {
  disabled?: boolean;
  onCredential: (idToken: string) => void;
};

export function GoogleSignInButton({
  disabled = false,
  onCredential,
}: GoogleSignInButtonProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || disabled) {
      return;
    }
    let active = true;
    let cleanup: (() => void) | undefined;
    setError(null);
    void mountGoogleIdButton({
      container: host,
      context: "signin",
      onCredential: (idToken) => {
        if (active) {
          onCredential(idToken);
        }
      },
      onError: (mountError) => {
        if (active) {
          setError(mountError.message);
        }
      },
    })
      .then((dispose) => {
        cleanup = dispose;
      })
      .catch((mountError: unknown) => {
        if (active) {
          setError(
            mountError instanceof Error
              ? mountError.message
              : "Google Sign-In could not start.",
          );
        }
      });
    return () => {
      active = false;
      cleanup?.();
    };
  }, [disabled, onCredential]);

  return (
    <>
      <div ref={hostRef} className="auth-google-button" aria-busy={disabled} />
      {error ? (
        <p className="auth-inline-error" role="alert">
          {error}
        </p>
      ) : null}
    </>
  );
}
