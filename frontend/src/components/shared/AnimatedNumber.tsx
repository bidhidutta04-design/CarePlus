"use client";

import { memo, useMemo } from "react";
import { useAnimatedCounter } from "@/hooks/useAnimatedCounter";

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  format?: (n: number) => string;
  className?: string;
}

/**
 * Renders a number that animates smoothly from 0 to its target value.
 * Uses a format function to preserve commas, currency symbols, decimals, etc.
 * Screen readers receive the final static value via aria-label.
 */
export const AnimatedNumber = memo(function AnimatedNumber({
  value,
  duration = 800,
  format,
  className,
}: AnimatedNumberProps) {
  const animated = useAnimatedCounter(value, duration);
  const formatted = useMemo(
    () => (format ? format(animated) : String(animated)),
    [animated, format],
  );

  return (
    <span aria-label={format ? format(value) : String(value)} className={className}>
      {formatted}
    </span>
  );
});
