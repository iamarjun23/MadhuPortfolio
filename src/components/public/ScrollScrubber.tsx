"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function ScrollScrubber() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== "/") {
      return;
    }

    const updateScrubber = () => {
      const documentElement = document.documentElement;
      const scrollableHeight = documentElement.scrollHeight - documentElement.clientHeight;
      const progress = scrollableHeight > 0 ? (window.scrollY / scrollableHeight) * 100 : 0;
      documentElement.style.setProperty("--scrub-width", `${Math.min(progress, 100)}%`);
    };

    updateScrubber();
    window.addEventListener("scroll", updateScrubber, { passive: true });

    return () => {
      window.removeEventListener("scroll", updateScrubber);
      document.documentElement.style.removeProperty("--scrub-width");
    };
  }, [pathname]);

  return pathname === "/" ? <span className="scrubber" aria-hidden="true" /> : null;
}
