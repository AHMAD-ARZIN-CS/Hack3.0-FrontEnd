"use client";

/**
 * Runs an async service call and tracks loading / error / data.
 * Re-runs when `deps` change (compared by JSON). Call `reload()` to retry.
 *
 *   const { data, loading, error, reload } = useAsync(() => getResources(q), [q]);
 */
import { useCallback, useEffect, useRef, useState } from "react";

interface Settled<T> {
  key: string;
  data?: T;
  error?: unknown;
}

export function useAsync<T>(fn: () => Promise<T>, deps: readonly unknown[]) {
  const fnRef = useRef(fn);
  useEffect(() => {
    fnRef.current = fn;
  });

  const [attempt, setAttempt] = useState(0);
  const key = `${JSON.stringify(deps)}#${attempt}`;
  const [settled, setSettled] = useState<Settled<T> | null>(null);

  useEffect(() => {
    let cancelled = false;
    fnRef.current().then(
      (data) => !cancelled && setSettled({ key, data }),
      (error) => !cancelled && setSettled({ key, error }),
    );
    return () => {
      cancelled = true;
    };
  }, [key]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);
  const current = settled?.key === key ? settled : null;

  return {
    loading: current === null,
    data: current?.data,
    error: current?.error,
    reload,
  };
}
