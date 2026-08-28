"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function ScrollScrubber() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== "/") {
      return;
    }

    const documentElement = document.documentElement;
    let frame = 0;
    // Cached because reading scrollHeight/clientHeight forces a layout, and the
    // page only changes height on resize — not on every scroll event.
    let scrollableHeight = documentElement.scrollHeight - documentElement.clientHeight;

    const writeScrubber = () => {
      const progress = scrollableHeight > 0 ? (window.scrollY / scrollableHeight) * 100 : 0;
      documentElement.style.setProperty("--scrub-width", `${Math.min(progress, 100)}%`);
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        writeScrubber();
      });
    };

    const observer = new ResizeObserver(() => {
      scrollableHeight = documentElement.scrollHeight - documentElement.clientHeight;
      writeScrubber();
    });
    observer.observe(document.body);

    writeScrubber();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      if (frame) cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      documentElement.style.removeProperty("--scrub-width");
    };
  }, [pathname]);

  return pathname === "/" ? <span className="scrubber" aria-hidden="true" /> : null;
}
