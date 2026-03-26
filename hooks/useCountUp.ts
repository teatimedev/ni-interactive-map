"use client";

import { useState, useEffect, useRef } from "react";

/**
 * Animates a number from 0 to a target value.
 * Uses requestAnimationFrame for smooth 60fps counting.
 */
export function useCountUp(
  target: number,
  duration: number = 600,
  enabled: boolean = true
): number {
  const [current, setCurrent] = useState(0);
  const startTime = useRef<number | null>(null);
  const rafId = useRef<number>(0);

  useEffect(() => {
    if (!enabled || target === 0) {
      setCurrent(target);
      return;
    }

    startTime.current = null;
    setCurrent(0);

    function animate(timestamp: number) {
      if (startTime.current === null) startTime.current = timestamp;
      const elapsed = timestamp - startTime.current;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(eased * target));

      if (progress < 1) {
        rafId.current = requestAnimationFrame(animate);
      }
    }

    rafId.current = requestAnimationFrame(animate);

    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [target, duration, enabled]);

  return current;
}
