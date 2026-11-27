"use client";

import { useEffect, useRef, useState } from "react";

/* Long enough that sweeping the pointer across a board, or tabbing past a card, boots
   nothing; short enough that a deliberate hover is ready before the click. */
const WARM_DELAY_MS = 150;

/** The card whose embedded player is booted ahead of a click (see MediaViewer `warming`).
    `warmSoon` arms it after a short pause on the card; `cancel` drops a pending arm when the
    pointer or focus leaves, keeping a player already warmed; `clear` drops both. Only a
    mouse hover or keyboard focus counts: a touch also fires pointerenter when a scroll
    starts on a card, which would load a player per card scrolled over. `keyOf` names a
    target, so warming the one already warm changes nothing. */
export function useWarmTarget<T>(keyOf: (target: T) => string) {
  const [warm, setWarm] = useState<T | null>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const cancel = () => window.clearTimeout(timer.current);

  /** `pointerType` is the event's, or omitted for keyboard focus. */
  const warmSoon = (target: T, pointerType?: string) => {
    cancel();
    if (pointerType !== undefined && pointerType !== "mouse") return;
    timer.current = window.setTimeout(
      () => setWarm((current) => (current && keyOf(current) === keyOf(target) ? current : target)),
      WARM_DELAY_MS,
    );
  };

  const clear = () => {
    cancel();
    setWarm(null);
  };

  return { warm, warmSoon, cancel, clear };
}
