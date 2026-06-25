import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

type Options = {
  activeThreadId?: string | null;
  messages: readonly unknown[];
  isSending: boolean;
  streamingNarrative?: string | null;
  hitlBusyKey?: string | null;
};

export function useCoPilotFeedAutoScroll({
  activeThreadId,
  messages,
  isSending,
  streamingNarrative,
  hitlBusyKey,
}: Options) {
  const feedRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback((behavior: ScrollBehavior) => {
    const feed = feedRef.current;
    if (!feed) {
      return;
    }
    feed.scrollTo({
      top: feed.scrollHeight,
      behavior,
    });
  }, []);

  useLayoutEffect(() => {
    if (!activeThreadId) {
      return;
    }
    scrollToBottom("auto");
  }, [activeThreadId, scrollToBottom]);

  useEffect(() => {
    if (!activeThreadId) {
      return;
    }
    const behavior =
      isSending || hitlBusyKey || streamingNarrative ? "auto" : "smooth";
    scrollToBottom(behavior);
  }, [
    activeThreadId,
    hitlBusyKey,
    isSending,
    messages,
    scrollToBottom,
    streamingNarrative,
  ]);

  return feedRef;
}
