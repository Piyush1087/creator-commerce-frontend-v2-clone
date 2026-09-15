import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchCreatorBrand,
  mutateCreatorBrand,
  CreatorBrandRequestError,
} from "../api/creator-brand-client";
import type { CreatorBrandConsumer } from "../contracts/creator-brand-consumer.schema";
import type { CreatorBrandCommand } from "../contracts/creator-brand-profile.contract";

export function useCreatorBrand() {
  const [data, setData] = useState<CreatorBrandConsumer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const readController = useRef<AbortController | null>(null);
  const busy = useRef(false);
  const sequence = useRef(0);
  const retry = useCallback(async () => {
    readController.current?.abort();
    const controller = new AbortController();
    readController.current = controller;
    const readSequence = ++sequence.current;
    setError(null);
    try {
      const next = await fetchCreatorBrand(controller.signal);
      if (readSequence === sequence.current) setData(next);
    } catch (caught) {
      if (!controller.signal.aborted && readSequence === sequence.current)
        setError(
          caught instanceof Error
            ? caught.message
            : "Creator Brand could not be loaded.",
        );
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);
  useEffect(() => {
    void retry();
    return () => {
      readController.current?.abort();
      ++sequence.current;
    };
  }, [retry]);
  const submit = async (command: CreatorBrandCommand) => {
    if (busy.current || conflict) return false;
    busy.current = true;
    setPending(true);
    setError(null);
    setAnnouncement("");
    readController.current?.abort();
    ++sequence.current;
    try {
      const next = await mutateCreatorBrand(command);
      setData(next);
      setAnnouncement("Creator Brand saved. Confirmed values updated.");
      return true;
    } catch (caught) {
      const message =
        caught instanceof Error
          ? caught.message
          : "Creator Brand could not be saved.";
      if (caught instanceof CreatorBrandRequestError && caught.status === 409) {
        setConflict(true);
        await retry();
      }
      setError(message);
      return false;
    } finally {
      busy.current = false;
      setPending(false);
    }
  };
  return {
    data,
    loading,
    error,
    pending,
    conflict,
    announcement,
    retry,
    submit,
    reviewed: () => {
      setConflict(false);
      setError(null);
    },
  };
}
