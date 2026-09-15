import { useCallback, useEffect, useRef, useState } from "react";
import {
  readPortfolio,
  writePortfolio,
  PortfolioRequestError,
} from "../api/portfolio-client";
import type {
  PortfolioCommand,
  PortfolioConsumer,
  PortfolioFilter,
} from "../contracts/portfolio-consumer";

/** Instance is keyed by authenticated Creator subject/workspace and filter. No shared source cache. */
export function usePortfolio(filter: PortfolioFilter) {
  const [data, setData] = useState<PortfolioConsumer | null>(null),
    [loading, setLoading] = useState(true),
    [pending, setPending] = useState(false),
    [error, setError] = useState<string | null>(null),
    [conflict, setConflict] = useState(false),
    [announcement, setAnnouncement] = useState("");
  const controller = useRef<AbortController | null>(null),
    sequence = useRef(0),
    busy = useRef(false);
  const handleError = useCallback((caught: unknown) => {
    if (
      caught instanceof PortfolioRequestError &&
      [401, 403].includes(caught.status)
    )
      setData(null);
    setError(
      caught instanceof Error
        ? caught.message
        : "Portfolio could not be loaded.",
    );
  }, []);
  const reload = useCallback(async () => {
    controller.current?.abort();
    const next = new AbortController();
    controller.current = next;
    const serial = ++sequence.current;
    try {
      const value = await readPortfolio(filter, next.signal);
      if (serial === sequence.current) {
        setData(value);
        setError(null);
      }
    } catch (caught) {
      if (!next.signal.aborted && serial === sequence.current)
        handleError(caught);
    } finally {
      if (serial === sequence.current) setLoading(false);
    }
  }, [filter, handleError]);
  const invalidate = useCallback(() => {
    controller.current?.abort();
    sequence.current += 1;
  }, []);
  useEffect(() => {
    void reload();
    return invalidate;
  }, [reload, invalidate]);
  const submit = async (command: PortfolioCommand) => {
    if (busy.current || conflict) return false;
    busy.current = true;
    setPending(true);
    setError(null);
    controller.current?.abort();
    const next = new AbortController();
    controller.current = next;
    const serial = ++sequence.current;
    try {
      await writePortfolio(command, next.signal);
      if (serial !== sequence.current) return false;
      await reload();
      setAnnouncement("Portfolio saved.");
      return true;
    } catch (caught) {
      if (serial === sequence.current && !next.signal.aborted) {
        if (caught instanceof PortfolioRequestError && caught.status === 409) {
          setConflict(true);
          await reload();
        }
        handleError(caught);
      }
      return false;
    } finally {
      busy.current = false;
      setPending(false);
    }
  };
  const loadMore = async () => {
    if (!data?.nextCursor || busy.current) return;
    busy.current = true;
    setPending(true);
    const serial = sequence.current;
    const next = new AbortController();
    controller.current = next;
    try {
      const page = await readPortfolio(filter, next.signal, data.nextCursor);
      if (serial !== sequence.current) return;
      if (page.currentRevision !== data.currentRevision) {
        await reload();
        setAnnouncement("Portfolio changed; the latest first page is shown.");
        return;
      }
      setData({
        ...page,
        items: [...data.items, ...page.items].filter(
          (item, index, all) =>
            all.findIndex((i) => i.id === item.id) === index,
        ),
      });
    } catch (caught) {
      if (!next.signal.aborted && serial === sequence.current)
        handleError(caught);
    } finally {
      busy.current = false;
      setPending(false);
    }
  };
  return {
    data,
    loading,
    pending,
    error,
    conflict,
    announcement,
    reload,
    submit,
    loadMore,
    reviewed: () => {
      setConflict(false);
      setError(null);
    },
  };
}
