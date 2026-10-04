"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { TimelinePosition } from "@/lib/section-timeline";

/**
 * Section label drawn as a full-width edit-timeline strip, with the playhead at
 * the section's place on the homepage. Without a position (Studio previews show
 * one section at a time) the playhead rests at the start and no number is shown.
 * The first time the strip scrolls into view, the progress line draws from zero
 * and the playhead drops in (CSS, skipped under reduced motion).
 */
export function SectionTimeline({
  label,
  position,
}: Readonly<{ label: string; position?: TimelinePosition }>) {
  const ref = useRef<HTMLDivElement>(null);
  const [isIn, setIsIn] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setIsIn(true);
        observer.disconnect();
      },
      { threshold: 0.6 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const at = position ? ((position.index - 0.5) / position.total) * 100 : 0;
  // Past the midpoint the label hangs left of the playhead so it never runs off the track.
  const className = [
    "timeline-slate",
    at > 50 && "timeline-slate--end",
    isIn && "timeline-slate--in",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div ref={ref} className={className} style={{ "--at": `${at}%` } as CSSProperties}>
      <span className="timeline-slate__label">
        {position && <b aria-hidden="true">{String(position.index).padStart(2, "0")}</b>}
        {label}
      </span>
    </div>
  );
}
