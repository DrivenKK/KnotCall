"use client";

import { useEffect, useRef, useState } from "react";

export function useMeetingTimer(active: boolean) {
  const [seconds, setSeconds] = useState(0);
  const wasActive = useRef(false);

  useEffect(() => {
    if (active && !wasActive.current) {
      setSeconds(0);
    }
    wasActive.current = active;

    if (!active) return;
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [active]);

  return seconds;
}
