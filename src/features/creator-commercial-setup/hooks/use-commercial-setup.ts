import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchWork,
  fetchRates,
  saveWork,
  saveRates,
  CommercialRequestError,
} from "../api/commercial-client";
import type {
  WorkConsumer,
  RateConsumer,
  WorkCommand,
  RateCommand,
} from "../contracts/commercial.schema";
const safeMessage = (caught: unknown) =>
  caught instanceof CommercialRequestError
    ? caught.message
    : "Commercial Setup returned an unavailable or invalid response. Previously confirmed values and unsaved changes are preserved.";
export function useCommercialSetup() {
  const [work, setWork] = useState<WorkConsumer | null>(null),
    [rates, setRates] = useState<RateConsumer | null>(null);
  const [loading, setLoading] = useState(true),
    [pending, setPending] = useState(false),
    [error, setError] = useState<string | null>(null),
    [conflict, setConflict] = useState(false),
    [authorized, setAuthorized] = useState(true),
    [announcement, setAnnouncement] = useState("");
  const controller = useRef<AbortController | null>(null),
    sequence = useRef(0),
    busy = useRef(false);
  const retry = useCallback(async () => {
    controller.current?.abort();
    const read = new AbortController();
    controller.current = read;
    const identity = ++sequence.current;
    const result = await Promise.allSettled([
      fetchWork(read.signal),
      fetchRates(read.signal),
    ]);
    if (read.signal.aborted || sequence.current !== identity) return;
    if (result[0].status === "fulfilled") setWork(result[0].value);
    if (result[1].status === "fulfilled") setRates(result[1].value);
    const failures = result.filter(
      (item): item is PromiseRejectedResult => item.status === "rejected",
    );
    setAuthorized(
      !failures.some(
        (item) =>
          item.reason instanceof CommercialRequestError &&
          [401, 403].includes(item.reason.status),
      ),
    );
    setError(failures.length ? safeMessage(failures[0].reason) : null);
    setLoading(false);
  }, []);
  useEffect(() => {
    const activeSequence = sequence;
    void retry();
    return () => {
      controller.current?.abort();
      ++activeSequence.current;
    };
  }, [retry]);
  const submit = async (
    section: "work" | "rates",
    command: WorkCommand | RateCommand,
  ) => {
    if (busy.current || conflict || !authorized) return false;
    busy.current = true;
    setPending(true);
    setError(null);
    setAnnouncement("");
    controller.current?.abort();
    ++sequence.current;
    try {
      if (section === "work") {
        const next = await saveWork(command as WorkCommand);
        setWork(next);
      } else {
        const next = await saveRates(command as RateCommand);
        setRates(next);
      }
      await retry();
      setAnnouncement(
        section === "work" ? "Work Preferences saved." : "Rate Card saved.",
      );
      return true;
    } catch (caught) {
      if (caught instanceof CommercialRequestError && caught.status === 409) {
        setConflict(true);
        await retry();
      }
      if (
        caught instanceof CommercialRequestError &&
        [401, 403].includes(caught.status)
      )
        setAuthorized(false);
      setError(safeMessage(caught));
      return false;
    } finally {
      busy.current = false;
      setPending(false);
    }
  };
  return {
    work,
    rates,
    loading,
    pending,
    error,
    conflict,
    authorized,
    announcement,
    retry,
    saveWork: (command: WorkCommand) => submit("work", command),
    saveRates: (command: RateCommand) => submit("rates", command),
    reviewed: () => {
      setConflict(false);
      setError(null);
    },
  };
}
