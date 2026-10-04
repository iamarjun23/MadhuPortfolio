"use client";

import { useEffect, useRef, useState } from "react";
import { MediaImage } from "@/components/public/MediaImage";
import { ScrollPager } from "@/components/public/ScrollPager";
import { SectionTimeline } from "@/components/public/SectionTimeline";
import type { TimelinePosition } from "@/lib/section-timeline";
import { realImage } from "@/lib/placeholders";
import { PHONE_MAX_WIDTH } from "@/lib/site-scale";
import { useScrollPager } from "@/lib/use-scroll-pager";
import type { Praise } from "@/schemas";

// How long the phone layout holds on one card before moving to the next.
const CARD_MS = 6000;

// Card width (incl. gap) used to size the marquee. Keep in sync with .testimonials figure in base.css.
const CARD_SPAN = 696;
// A single copy of the track must be wider than any real viewport, or the duplicate
// copy used for the seamless loop would become visible at the same time as the original.
const MIN_TRACK_WIDTH = 2600;

export function Testimonials({
  data,
  timeline,
}: Readonly<{ data: Praise; timeline?: TimelinePosition }>) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [isHeld, setIsHeld] = useState(false);
  const { page, pages, step } = useScrollPager(scrollerRef, data.quotes.length);

  /* On the phone layout the marquee becomes one card at a time, moved on by this timer
     and held while a finger or the keyboard is on it. Desktop keeps its CSS marquee, and
     visitors who asked for less motion page through by hand. */
  useEffect(() => {
    if (isHeld || pages < 2) return;
    if (!window.matchMedia(`(max-width: ${PHONE_MAX_WIDTH}px)`).matches) return;
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.querySelector(".motion-disabled")
    ) {
      return;
    }
    const timer = window.setTimeout(() => {
      if (page < pages - 1) step(1);
      else scrollerRef.current?.scrollTo({ left: 0, behavior: "smooth" });
    }, CARD_MS);
    return () => window.clearTimeout(timer);
  }, [isHeld, page, pages, step]);

  if (!data.visible || data.quotes.length === 0) return null;

  const repeats = Math.max(1, Math.ceil(MIN_TRACK_WIDTH / (CARD_SPAN * data.quotes.length)));
  const set = Array.from({ length: repeats }, () => data.quotes).flat();
  const duration = set.length * 4;

  return (
    <section className="section" id="testimonials">
      <div className="wrap">
        <SectionTimeline label={data.eyebrow} position={timeline} />
        <header className="section-heading">
          <h2>{data.heading}</h2>
        </header>
        <div
          className="testimonials"
          ref={scrollerRef}
          onPointerDown={() => setIsHeld(true)}
          onPointerUp={() => setIsHeld(false)}
          onPointerCancel={() => setIsHeld(false)}
          onFocus={() => setIsHeld(true)}
          onBlur={() => setIsHeld(false)}
        >
          <div className="testimonials__track" style={{ animationDuration: `${duration}s` }}>
            {[...set, ...set].map((quote, i) => {
              const image = realImage(quote.image);
              // Repeated copies of a quote keep its scene number.
              const scene = String((i % data.quotes.length) + 1).padStart(2, "0");
              return (
                // Only the first copy is read out; the rest exist for the loop.
                <figure
                  className={quote.isSample ? "is-sample" : undefined}
                  key={`${quote.id}-${i}`}
                  aria-hidden={i >= data.quotes.length || undefined}
                >
                  <div className="testimonials__slate" aria-hidden="true">
                    <div>
                      <span>Roll</span>A01
                    </div>
                    <div>
                      <span>Scene</span>
                      {scene}
                    </div>
                    <div>
                      <span>Take</span>01
                    </div>
                  </div>
                  <blockquote>
                    <span>{quote.quote}</span>
                  </blockquote>
                  <figcaption>
                    <span className="testimonials__dir" aria-hidden="true">
                      Dir.
                    </span>
                    <span className="testimonials__avatar">
                      {image ? (
                        // Decorative: the name is printed right beside it.
                        <MediaImage src={image.url} alt="" width={128} height={128} sizes="40px" />
                      ) : (
                        quote.initials
                      )}
                    </span>
                    <div>
                      <b>{quote.name}</b>
                      <small>{quote.role}</small>
                    </div>
                    {quote.isSample ? <small>{data.sampleLabel}</small> : null}
                  </figcaption>
                </figure>
              );
            })}
          </div>
        </div>
        {/* Phone layout only. */}
        <ScrollPager page={page} pages={pages} onStep={step} label="quote" />
      </div>
    </section>
  );
}
