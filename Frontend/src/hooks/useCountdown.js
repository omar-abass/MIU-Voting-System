import { useEffect, useState } from 'react';
import { splitDuration } from '../utils/format.js';

/**
 * Counts down to `target` (ISO string or Date). This is a DISPLAY helper only:
 * the server decides whether a vote is accepted, using its own clock.
 */
export function useCountdown(target) {
  const targetMs = target ? new Date(target).getTime() : NaN;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (Number.isNaN(targetMs)) return undefined;
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetMs]);

  if (Number.isNaN(targetMs)) return { ...splitDuration(0), expired: true, remainingMs: 0 };
  const remainingMs = Math.max(targetMs - now, 0);
  return { ...splitDuration(remainingMs), expired: remainingMs === 0, remainingMs };
}
