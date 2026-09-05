"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Animates a number from its current displayed value to a new target value.
 * Uses requestAnimationFrame for smooth, jank-free animation.
 * Respects prefers-reduced-motion by showing the final value immediately.
 * Cleans up animation frames on unmount.
 */
export function useAnimatedCounter(
  target: number,
  duration: number = 800,
): number {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number | null>(null);
  const fromRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);

  const animate = useCallback(
    (from: number, to: number) => {
      fromRef.current = from;
      startTimeRef.current = null;

      const prefersReduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      if (prefersReduced || duration <= 0) {
        setDisplay(to);
        return;
      }

      const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

      const step = (ts: number) => {
        if (startTimeRef.current === null) startTimeRef.current = ts;
        const elapsed = ts - startTimeRef.current;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeOutCubic(progress);
        setDisplay(fromRef.current + (to - fromRef.current) * eased);

        if (progress < 1) {
          rafRef.current = requestAnimationFrame(step);
        }
      };

      rafRef.current = requestAnimationFrame(step);
    },
    [duration],
  );

  useEffect(() => {
    animate(fromRef.current, target);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [target, animate]);

  return display;
}
