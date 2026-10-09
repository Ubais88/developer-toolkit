import { useEffect, useState } from 'react';

/** Current epoch ms, re-rendering on every `intervalMs` boundary (aligned so seconds flip together). */
export function useNow(intervalMs = 1000, enabled = true): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!enabled) return;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      const t = Date.now();
      timer = setTimeout(() => {
        setNow(Date.now());
        schedule();
      }, intervalMs - (t % intervalMs) + 5);
    };
    setNow(Date.now());
    schedule();
    return () => clearTimeout(timer);
  }, [intervalMs, enabled]);

  return now;
}
