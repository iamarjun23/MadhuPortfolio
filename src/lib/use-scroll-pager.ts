"use client";

import { type RefObject, useCallback, useEffect, useState } from "react";
import { pagerState } from "@/lib/scroll-pager";

function columnGap(element: HTMLElement) {
  return parseFloat(getComputedStyle(element).columnGap) || 0;
}

/**
 * Follows a sideways scroller a page at a time: which page is showing, how many
 * there are, and a `step` that slides to the next or previous one. `count` is the
 * number of items, so the pages are counted again when the list changes.
 */
export function useScrollPager(ref: RefObject<HTMLElement | null>, count: number) {
  const [state, setState] = useState({ page: 0, pages: 1 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    let frame = 0;

    const read = () => {
      frame = 0;
      const next = pagerState(
        element.scrollLeft,
        element.clientWidth,
        element.scrollWidth,
        columnGap(element),
      );
      setState((current) =>
        current.page === next.page && current.pages === next.pages ? current : next,
      );
    };
    // One read per frame: scroll events arrive far faster than the dots can change.
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };

    schedule();
    element.addEventListener("scroll", schedule, { passive: true });
    const observer = new ResizeObserver(schedule);
    observer.observe(element);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      element.removeEventListener("scroll", schedule);
      observer.disconnect();
    };
  }, [ref, count]);

  const step = useCallback(
    (direction: 1 | -1) => {
      const element = ref.current;
      if (!element) return;
      element.scrollBy({
        left: direction * (element.clientWidth + columnGap(element)),
        behavior: "smooth",
      });
    },
    [ref],
  );

  return { ...state, step };
}
