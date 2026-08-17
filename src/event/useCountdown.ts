import { useEffect, useRef, useState } from "react";

export function useCountdown(endsAt: number | null, serverNow: number | null): number | null {
  const anchorRef = useRef<{ endsAt: number; serverNow: number; receivedAt: number } | null>(null);
  const [, setTick] = useState(0);

  if (endsAt == null || serverNow == null) {
    anchorRef.current = null;
  } else if (
    !anchorRef.current ||
    anchorRef.current.endsAt !== endsAt ||
    anchorRef.current.serverNow !== serverNow
  ) {
    anchorRef.current = { endsAt, serverNow, receivedAt: Date.now() };
  }

  useEffect(() => {
    if (endsAt == null) return;
    const id = window.setInterval(() => setTick((n) => n + 1), 200);
    return () => window.clearInterval(id);
  }, [endsAt]);

  if (!anchorRef.current) return null;
  const anchor = anchorRef.current;
  return Math.max(0, anchor.endsAt - anchor.serverNow - (Date.now() - anchor.receivedAt));
}

export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
