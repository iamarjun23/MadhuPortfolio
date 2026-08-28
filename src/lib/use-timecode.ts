"use client";

import { useEffect, useRef } from "react";

export const initialTimecode = "00:00:00:00";

const framesPerSecond = 24;

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function formatTimecode(elapsedMs: number) {
  const seconds = Math.floor(elapsedMs / 1000);
  const frames = Math.floor((elapsedMs % 1000) / (1000 / framesPerSecond));

  return `${pad(Math.floor(seconds / 3600))}:${pad(Math.floor(seconds / 60) % 60)}:${pad(
    seconds % 60,
  )}:${pad(frames)}`;
}

/**
 * Drives the running timecode readouts by writing text straight into the node.
 * Ticking React state 24 times a second re-renders the whole surrounding
 * section on every frame, which is what made scrolling feel chunky. The loop
 * also parks itself while the readout is off screen or the tab is hidden.
 */
export function useTimecode() {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let lastText = initialTimecode;
    let isOnScreen = true;

    const tick = () => {
      const text = formatTimecode(performance.now());
      if (text !== lastText) {
        lastText = text;
        node.textContent = text;
      }
      frame = requestAnimationFrame(tick);
    };

    const start = () => {
      if (frame || !isOnScreen || document.hidden) return;
      frame = requestAnimationFrame(tick);
    };

    const stop = () => {
      if (!frame) return;
      cancelAnimationFrame(frame);
      frame = 0;
    };

    const observer = new IntersectionObserver(([entry]) => {
      isOnScreen = entry?.isIntersecting ?? true;
      if (isOnScreen) start();
      else stop();
    });
    observer.observe(node);

    const onVisibilityChange = () => {
      if (document.hidden) stop();
      else start();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    start();

    return () => {
      stop();
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return ref;
}
