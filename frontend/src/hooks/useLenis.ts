"use client";

import { useEffect } from "react";
import Lenis from "lenis";

export function useLenis(): void {
  useEffect(() => {
    // Skip smooth scrolling where it hurts: touch devices, reduced-motion,
    // or missing APIs. Native scroll is faster and jank-free there.
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    if (typeof requestAnimationFrame === "undefined") return;

    const lenis = new Lenis({
      lerp: 0.18,
      smoothWheel: false, // never hijack wheel/trackpad — the #1 perceived-lag cause
      syncTouch: false,
    });
    let raf = 0;
    let running = true;
    const loop = (time: number): void => {
      if (!running) return;
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const onVisibility = (): void => {
      // Pause the RAF loop when the tab is hidden to save CPU/battery.
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!running) {
        running = true;
        raf = requestAnimationFrame(loop);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibility);
      lenis.destroy();
    };
  }, []);
}
