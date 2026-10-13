import { useCallback, useEffect, useRef, useState } from "react";
import { REFRESH_MS } from "@/lib/config";

export type Polled<T> = { data: T | null; error: Error | null; loading: boolean };

/** Lädt Daten sofort, dann regelmäßig und beim Zurückkehren in die App. */
export function usePolling<T>(fetcher: () => Promise<T>, interval = REFRESH_MS): Polled<T> {
  const [state, setState] = useState<Polled<T>>({ data: null, error: null, loading: true });
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const load = useCallback(async () => {
    try {
      const data = await fetcherRef.current();
      setState({ data, error: null, loading: false });
    } catch (error) {
      console.error(error);
      // Alte Daten behalten, wenn ein Neuladen fehlschlägt
      setState((s) => ({ data: s.data, error: error as Error, loading: false }));
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, interval);
    const onVisible = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load, interval]);

  return state;
}

/** Aktuelle Zeit, jede Minute aktualisiert (für „vor X Min“). */
export function useNow(): number {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);
  return now;
}
