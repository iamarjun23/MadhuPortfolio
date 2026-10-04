"use client";

import { type CSSProperties, useEffect, useId, useRef, useState } from "react";
import { type RollCredit, creditsFor, formatTimecode, runtimeSeconds } from "@/lib/credits-roll";

// How far down the viewport the playhead reads the page from.
const PROBE = 0.35;
const ROLL_MS = 3000;
const TIMECODE_ZERO = "00:00:00:00";

type Chapter = Readonly<{
  number: string;
  /** Where the chapter's strip sits among the strips in the markup. */
  slot: number;
  label: string;
  heading: string;
  start: number;
  end: number;
}>;
type ChapterStyle = CSSProperties & Record<"--clip-start" | "--clip-length", string>;
type StackStyle = CSSProperties & Record<"--card", number>;

type NavReelProps = Readonly<{
  /** The availability line, or null when the owner is not taking work. */
  availability: string | null;
  contactLabel: string;
  ownerName: string;
}>;

/* The chapters are the homepage's own numbered section strips (SectionTimeline),
   so the island always shows the same sections, numbers and labels as the page,
   and a section hidden from the page drops out here too. */
function chapterSlates() {
  return Array.from(document.querySelectorAll<HTMLElement>("#top .timeline-slate")).filter(
    (slate) => slate.querySelector(".timeline-slate__label b"),
  );
}

function measureChapters(): Chapter[] {
  const found = chapterSlates().flatMap((slate, slot) => {
    const section = slate.closest("section");
    const label = slate.querySelector(".timeline-slate__label");
    const number = label?.querySelector("b")?.textContent?.trim();
    if (!section || !label || !number) return [];
    const name = Array.from(label.childNodes)
      .filter((node) => node.nodeType === Node.TEXT_NODE)
      .map((node) => node.textContent ?? "")
      .join("")
      .trim();
    const heading = section.querySelector("h2")?.textContent?.trim() || name;
    return [
      {
        number,
        slot,
        label: name,
        heading,
        start: section.getBoundingClientRect().top + window.scrollY,
      },
    ];
  });
  // In the order they sit on screen: the phone layout shows the sections in a
  // different order from the markup.
  found.sort((a, b) => a.start - b.start);
  // The last chapter ends where the probe line stops at the bottom of the page.
  const pageEnd = document.documentElement.scrollHeight - window.innerHeight * (1 - PROBE);
  return found.map((chapter, index) => ({
    ...chapter,
    end: Math.max(chapter.start + 1, found[index + 1]?.start ?? pageEnd),
  }));
}

// The OS setting or the Studio's own motion switch (see the public layout).
function prefersStill() {
  return (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    document.querySelector(".motion-disabled") !== null
  );
}

const pad = (value: number) => String(value).padStart(2, "0");

/**
 * The navbar island once the hero has scrolled away: a mini video player whose
 * credits roll through what's showing, availability, what's next and the
 * runtime. The full credits open only when the visitor clicks the player.
 */
export function NavReel({ availability, contactLabel, ownerName }: NavReelProps) {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [active, setActive] = useState(-1);
  const [credits, setCredits] = useState<RollCredit[]>([]);
  const [card, setCard] = useState(0);
  const [isSnapping, setIsSnapping] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const playerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const creditsKey = useRef("");
  const panelId = useId();

  // Chapter positions shift as images load and fonts swap, so re-measure
  // whenever the page's size does. The observer also fires once on observe.
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      const measured = measureChapters();
      setChapters((previous) =>
        JSON.stringify(previous) === JSON.stringify(measured) ? previous : measured,
      );
    });
    observer.observe(document.body);
    return () => observer.disconnect();
  }, []);

  /* The playhead, progress fills and timecode move every frame, so they are
     written straight to the DOM; only what changes a few times per chapter
     (the active chapter and the credits) goes through React state. */
  useEffect(() => {
    const first = chapters[0];
    const last = chapters[chapters.length - 1];
    if (!first || !last) return;
    const labels = chapters.map((chapter) => chapter.label);
    let frame = 0;

    const update = () => {
      frame = 0;
      const probe = window.scrollY + window.innerHeight * PROBE;
      let index = -1;
      chapters.forEach((chapter, chapterIndex) => {
        if (probe >= chapter.start) index = chapterIndex;
      });
      const chapter = chapters[index];
      const length = chapter ? chapter.end - chapter.start : 1;
      const progress = chapter ? Math.min(1, Math.max(0, (probe - chapter.start) / length)) : 0;
      const overall = Math.min(1, Math.max(0, (probe - first.start) / (last.end - first.start)));
      const timecode = formatTimecode(window.scrollY);

      for (const element of [playerRef.current, panelRef.current]) {
        if (!element) continue;
        element.style.setProperty("--clip-progress", progress.toFixed(4));
        element.style.setProperty("--reel-progress", overall.toFixed(4));
        element.querySelectorAll("[data-runtime]").forEach((node) => {
          node.textContent = timecode;
        });
      }

      const nextCredits = creditsFor({
        labels,
        index,
        progress,
        availability,
        contactLabel,
        secondsLeft: runtimeSeconds((1 - progress) * length),
      });
      const key = JSON.stringify(nextCredits);
      if (key !== creditsKey.current) {
        creditsKey.current = key;
        setCredits(nextCredits);
        setIsSnapping(true);
        setCard(0);
      }
      setActive(index);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    frame = requestAnimationFrame(update);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, [chapters, availability, contactLabel]);

  // Runtime credits mounted after the last scroll frame start at zero until
  // the next scroll, so give them the current timecode straight away.
  useEffect(() => {
    const timecode = formatTimecode(window.scrollY);
    for (const element of [playerRef.current, panelRef.current]) {
      element?.querySelectorAll("[data-runtime]").forEach((node) => {
        node.textContent = timecode;
      });
    }
  }, [credits, active]);

  // Stepped roll: hold each credit, then roll up to the next. The stack ends
  // on a copy of the first credit, which snaps back to the real one unseen.
  useEffect(() => {
    if (credits.length < 2 || isPaused) return;
    const id = window.setInterval(() => {
      if (prefersStill()) return;
      setIsSnapping(false);
      setCard((current) => current + 1);
    }, ROLL_MS);
    return () => window.clearInterval(id);
  }, [credits.length, isPaused]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  const current = chapters[active];
  if (!current) return null;
  const next = chapters[active + 1];
  const [firstCredit] = credits;
  const stack = firstCredit && credits.length > 1 ? [...credits, firstCredit] : credits;
  const stackStyle: StackStyle = { "--card": card };
  const reelStart = chapters[0]?.start ?? 0;
  const reelLength = Math.max(1, (chapters[chapters.length - 1]?.end ?? 1) - reelStart);

  const jumpTo = (index: number) => {
    const slot = chapters[index]?.slot;
    if (slot === undefined) return;
    chapterSlates()[slot]?.closest("section")?.scrollIntoView({ block: "start" });
  };

  return (
    <>
      <button
        type="button"
        ref={playerRef}
        className="nav-reel"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen((open) => !open)}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onFocus={() => setIsPaused(true)}
        onBlur={() => setIsPaused(false)}
      >
        <span className="nav-reel__thumb" aria-hidden="true">
          {current.number}
        </span>
        <span className="nav-reel__credits" aria-hidden="true">
          <span
            className={`nav-reel__stack${isSnapping ? " is-snapping" : ""}`}
            style={stackStyle}
            onTransitionEnd={() => {
              if (card < credits.length) return;
              setIsSnapping(true);
              setCard(0);
            }}
          >
            {stack.map((credit, index) => (
              <span
                key={`${credit.role}-${index}`}
                className={`nav-reel__credit${credit.tone ? ` nav-reel__credit--${credit.tone}` : ""}`}
              >
                <span className="nav-reel__role">{credit.role}</span>
                <span className="nav-reel__value">
                  {credit.tone === "runtime" ? (
                    <span data-runtime>{TIMECODE_ZERO}</span>
                  ) : (
                    credit.value
                  )}
                </span>
              </span>
            ))}
          </span>
        </span>
        <span className="sr-only">{`Now showing ${current.label}. Show full credits`}</span>
      </button>

      <div
        id={panelId}
        ref={panelRef}
        className={`nav-reel__panel${isOpen ? " is-open" : ""}`}
        inert={!isOpen}
      >
        <div className="nav-reel__panel-inner">
          <div className="nav-reel__panel-body">
            <nav className="nav-reel__chapters" aria-label="Page chapters">
              {chapters.map((chapter, index) => {
                const style: ChapterStyle = {
                  flexGrow: chapter.end - chapter.start,
                  "--clip-start": ((chapter.start - reelStart) / reelLength).toFixed(4),
                  "--clip-length": ((chapter.end - chapter.start) / reelLength).toFixed(4),
                };
                return (
                  <button
                    type="button"
                    key={chapter.number}
                    className="nav-reel__chapter"
                    aria-current={index === active ? "location" : undefined}
                    style={style}
                    onClick={() => jumpTo(index)}
                  >
                    <span className="sr-only">{`Chapter ${chapter.number}: ${chapter.label}`}</span>
                  </button>
                );
              })}
              <span className="nav-reel__knob" aria-hidden="true" />
            </nav>

            <p className="nav-reel__eyebrow">Full credits</p>
            <dl className="nav-reel__grid">
              <div>
                <dt>Now showing</dt>
                <dd>
                  {current.label}
                  <small>{current.heading}</small>
                </dd>
              </div>
              <div>
                <dt>Up next</dt>
                <dd>
                  {next?.label ?? "Fin."}
                  <small>{next?.heading ?? "Thanks for watching"}</small>
                </dd>
              </div>
              {availability ? (
                <div className="nav-reel__status">
                  <dt>Status</dt>
                  <dd>{availability}</dd>
                </div>
              ) : null}
              <div className="nav-reel__runtime">
                <dt>Runtime</dt>
                <dd>
                  <span data-runtime>{TIMECODE_ZERO}</span>
                  <small>{`Chapter ${current.number} of ${pad(chapters.length)}`}</small>
                </dd>
              </div>
            </dl>

            <div className="nav-reel__footer">
              <span>{`Directed and edited by ${ownerName}`}</span>
              <span className="nav-reel__controls">
                <button
                  type="button"
                  aria-label="Previous chapter"
                  disabled={active === 0}
                  onClick={() => jumpTo(active - 1)}
                >
                  ‹
                </button>
                <button
                  type="button"
                  aria-label="Next chapter"
                  disabled={!next}
                  onClick={() => jumpTo(active + 1)}
                >
                  ›
                </button>
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
