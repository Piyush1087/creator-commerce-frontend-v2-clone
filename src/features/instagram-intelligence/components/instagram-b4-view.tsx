import { useCallback, useEffect, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { AUTH_ROUTES, instagramMediaDetailPath } from "../../auth/constants";
import { useAuthSession } from "../../../shared/auth/use-auth-session";
import { useInstagramB4 } from "../hooks/use-instagram-b4";
import { useInstagramMediaDetail } from "../hooks/use-instagram-media-detail";
import type { InstagramMediaDetailState } from "../hooks/use-instagram-media-detail";
import { InstagramMediaDetailDrawer } from "./instagram-media-detail";
import { InstagramWorkspace } from "./instagram-workspace";

function hasUnsafeRouteCharacter(value: string): boolean {
  return Array.from(value).some((character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint <= 31 || codePoint === 127;
  });
}

export function InstagramB4View() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const session = useAuthSession();
  const state = useInstagramB4();
  const { data, error, isLoading } = state;
  const splat = params["*"] ?? "";
  const routeMediaId = splat.startsWith("media/") ? splat.slice(6) : null;
  const validMediaId =
    routeMediaId &&
    routeMediaId.length <= 512 &&
    !routeMediaId.includes("/") &&
    !hasUnsafeRouteCharacter(routeMediaId)
      ? routeMediaId
      : null;
  const invalidDetailRoute = Boolean(splat && !validMediaId);
  const contextKey = `${session.currentUser?.id ?? "anonymous"}:${
    data?.connection.providerAccountId ?? "no-account"
  }`;
  const detail = useInstagramMediaDetail(
    data && !invalidDetailRoute ? validMediaId : null,
    contextKey,
  );
  const mediaActions = useRef(new Map<string, HTMLButtonElement>());
  const postsHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const lastOpenedMediaIdRef = useRef<string | null>(null);
  const detailWasOpenRef = useRef(false);

  const registerMediaAction = useCallback(
    (mediaId: string, element: HTMLButtonElement | null) => {
      if (element) mediaActions.current.set(mediaId, element);
      else mediaActions.current.delete(mediaId);
    },
    [],
  );
  const openMediaDetail = useCallback(
    (mediaId: string) => {
      lastOpenedMediaIdRef.current = mediaId;
      restoreFocusRef.current =
        mediaActions.current.get(mediaId) ?? postsHeadingRef.current;
      navigate(instagramMediaDetailPath(mediaId), {
        state: { instagramDetailOrigin: mediaId },
      });
    },
    [navigate],
  );
  const closeMediaDetail = useCallback(() => {
    navigate(AUTH_ROUTES.brandCentreInstagram);
  }, [navigate]);

  useEffect(() => {
    if (!splat) return;
    detailWasOpenRef.current = true;
    const origin = location.state as { instagramDetailOrigin?: unknown } | null;
    restoreFocusRef.current =
      origin?.instagramDetailOrigin === validMediaId && validMediaId
        ? (mediaActions.current.get(validMediaId) ?? postsHeadingRef.current)
        : postsHeadingRef.current;
  }, [data, location.state, splat, validMediaId]);

  useEffect(() => {
    if (splat || !detailWasOpenRef.current) return;
    const frame = window.requestAnimationFrame(() => {
      const mediaId = lastOpenedMediaIdRef.current;
      const target =
        (mediaId ? mediaActions.current.get(mediaId) : null) ??
        postsHeadingRef.current;
      target?.focus({ preventScroll: true });
      lastOpenedMediaIdRef.current = null;
      detailWasOpenRef.current = false;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [data, splat]);

  if (isLoading)
    return (
      <main className="instagram-b4">
        <h1>Instagram Intelligence</h1>
        <p role="status">Loading Instagram Intelligence…</p>
      </main>
    );
  if (error || !data)
    return (
      <main className="instagram-b4">
        <h1>Instagram Intelligence</h1>
        <p role="alert">{error}</p>
      </main>
    );
  const detailState: InstagramMediaDetailState = invalidDetailRoute
    ? { kind: "DETAIL_INVALID_RESPONSE" }
    : detail.state;
  return (
    <>
      <InstagramWorkspace
        data={data}
        isRefreshing={state.isRefreshing}
        announcement={state.announcement}
        cooldownEndsAt={state.cooldownEndsAt}
        onRefresh={state.requestRefresh}
        onOpenMediaDetail={openMediaDetail}
        registerMediaAction={registerMediaAction}
        representativePostsHeadingRef={postsHeadingRef}
      />
      {splat && (
        <InstagramMediaDetailDrawer
          state={detailState}
          onClose={closeMediaDetail}
          onRetry={detail.retry}
          restoreFocusRef={restoreFocusRef}
        />
      )}
    </>
  );
}
