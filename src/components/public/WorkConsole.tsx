"use client";

import { useEffect, useId, useRef, useState } from "react";
import { MediaImage } from "@/components/public/MediaImage";
import { reelBadge, reelThumbnail, resolveReel } from "@/lib/reel";
import type { Work } from "@/schemas";

type WorkProject = Work["lanes"][number]["projects"][number];

type PreviewSelection = {
  project: WorkProject;
  laneLabel: string;
};

type CardOffset = {
  x: number;
  y: number;
};

type BoardCardStyle = React.CSSProperties & {
  "--card-ox": string;
  "--card-oy": string;
  "--card-x": string;
  "--card-y": string;
  "--card-tilt": string;
  "--card-delay": string;
};

type DragState = {
  active: boolean;
  moved: boolean;
  id: string;
  pointerId: number;
  startX: number;
  startY: number;
  baseX: number;
  baseY: number;
  x: number;
  y: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

/* A card only counts as dragged once the pointer has travelled far enough that
   the gesture can no longer be read as a click, so a plain click still opens
   the video instead of nudging the card a pixel and swallowing the press. */
const DRAG_THRESHOLD = 5;
/* How far past the board's edge a card may be parked. */
const BOARD_SLACK = 16;
/* Keyboard equivalent of a drag, so the board is not pointer-only. */
const NUDGE_STEP = 18;

/* Cards are dealt one to a cell of a notional grid and then jogged out of it,
   which spreads them over the whole board while still reading as a scatter.
   Filling fixed rings in turn tipped every card left over into the innermost
   one and built a heap in the middle of the board; a spiral cures the heap but
   draws a circle, which leaves the corners of a wide board bare. */
const BOARD_ASPECT = 1.7;
/* How far out of its cell a card may be jogged, as a share of the cell. Enough
   that the grid behind the scatter cannot be read, not so much that cards
   wander back into each other. */
const BOARD_JOG = 0.5;
/* Past this many cards the board is being asked to hold more than it has room
   for, and they are drawn smaller rather than left to bury one another. */
const BOARD_DENSE_FROM = 28;

/* The "All work" view can swap the canvas for a globe: cards sit in a plain
   grid of rows and columns, that grid wrapped around a vertical cylinder so
   only its left and right edges bend away from the viewer - the rows
   themselves stay level, same as the flat grid layout. Every measurement here
   is in the globe's own space; the whole thing is scaled once to the room the
   board has, so none of it has to know the viewport. */
const GLOBE_CARD_W = 150;
const GLOBE_CARD_H = 118;
/* Clear space between two neighbours in the same row, and between one row
   and the next. Both are what keep cards from touching. */
const GLOBE_CARD_GAP = 80;
const GLOBE_ROW_GAP = 72;
/* Depth is set as a multiple of the cylinder's own radius, so a card at the
   front is always the same fraction larger than one out at the side however
   big the globe ends up. */
/* A deeper viewing distance keeps front cards from ballooning into their
   neighbours while preserving the gentle left/right bend. */
const GLOBE_DEPTH_RATIO = 16;
/* The cards are photographs, so blowing the globe up much past its laid-out
   size starts to show. */
const GLOBE_MAX_SCALE = 1.8;
const GLOBE_SPIN_DEG_PER_MS = 360 / 80000;
const GLOBE_DRAG_DEG_PER_PX = 0.35;
/* Keep the shared middle of both rows level. The cards' own Y rotation creates
   the curve at the left and right edges without bending the centre section. */
const GLOBE_TILT_DEG = 0;

type GlobePlacement = { y: number; radius: number; angle: number };

/* Keep the globe broad rather than tall. A large project list spread over
   three or four rows collapses into a narrow tower on wide screens because
   height becomes the limiting dimension when the globe is fitted to the
   board. Two rows let the cards use the full horizontal canvas. */
function getGlobeRowCount(total: number) {
  return total <= 12 ? 1 : 2;
}

/* Where every card sits on the cylinder, plus the depth the stage has to be
   viewed from for the columns to line up as one round body. Cards fill row by
   row, same reading order a flat grid uses, then wrap: every `columns`-th
   card starts the next row down. */
function getGlobeLayout(total: number) {
  const rows = getGlobeRowCount(total);
  const columns = Math.max(1, Math.ceil(total / rows));
  /* The radius that lets `columns` cards ring the cylinder without touching:
     each card claims a slice of the circle whose chord has to clear the
     card's own width. */
  const radius =
    columns > 1
      ? (GLOBE_CARD_W + GLOBE_CARD_GAP) / (2 * Math.sin(Math.PI / columns))
      : GLOBE_CARD_W;
  const rowStep = GLOBE_CARD_H + GLOBE_ROW_GAP;

  const placements: GlobePlacement[] = Array.from({ length: total }, (_, index) => {
    const row = Math.floor(index / columns);
    const column = index % columns;
    return {
      y: (row - (rows - 1) / 2) * rowStep,
      radius,
      /* Both rows use the same angles, making their centre cards line up while
         the outer cards naturally turn away around the cylinder. */
      angle: (360 * column) / columns,
    };
  });

  return { placements, perspective: radius * GLOBE_DEPTH_RATIO };
}

/* How much room the finished globe needs, measured on screen rather than in
   its own space: a card grows as it swings towards the viewer, and the front
   row is what decides where the cylinder's edge falls. */
function getGlobeSize(placements: readonly GlobePlacement[], perspective: number) {
  let halfWidth = 0;
  let halfHeight = 0;

  placements.forEach(({ y, radius }) => {
    const magnify = perspective / (perspective - radius);
    halfWidth = Math.max(halfWidth, radius + GLOBE_CARD_W / 2);
    halfHeight = Math.max(halfHeight, (Math.abs(y) + GLOBE_CARD_H / 2) * magnify);
  });

  return { width: Math.round(halfWidth * 2), height: Math.round(halfHeight * 2) };
}

const NUDGE_KEYS: Readonly<Record<string, CardOffset>> = {
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
};

/* Where every card sits before anyone touches it, as a pair of offsets from
   the middle of the board between -1 and 1. How far that actually is stays in
   CSS, so a narrow screen can pull the whole scatter in without this having to
   know the board's width. The numbers are rounded because `Math.sin` can
   differ in its last digit between the server's runtime and the browser's,
   which is enough on its own to fail hydration. */
/* Stands in for a random number without being one: the same card is jogged the
   same way on the server and in the browser, which a real random would not be. */
function boardNoise(seed: number) {
  const value = Math.sin(seed * 127.1) * 43758.5453;
  return value - Math.floor(value);
}

function getBoardLayout(total: number) {
  const columns = Math.max(1, Math.round(Math.sqrt(total * BOARD_ASPECT)));
  const rows = Math.ceil(total / columns);
  /* Cells run -1 to 1 either way, the same range the board's CSS spreads a
     card across, so a card in the last column lands against the right edge
     rather than somewhere short of it. */
  const across = (place: number, count: number) => (count > 1 ? (place / (count - 1)) * 2 - 1 : 0);

  return Array.from({ length: total }, (_, index) => {
    const row = Math.floor(index / columns);
    /* The last row is usually short, and spreading whatever it holds over the
       full width keeps the scatter from ending on a ragged edge. */
    const inRow = Math.min(columns, total - row * columns);
    const jog = (seed: number, count: number) =>
      (boardNoise(seed) - 0.5) * BOARD_JOG * (2 / Math.max(count - 1, 1));

    return {
      ox: (across(index % columns, inRow) + jog(index + 1, inRow)).toFixed(4),
      oy: (across(row, rows) + jog(index + 91, rows)).toFixed(4),
      tilt: `${(Math.sin(index * 12.9898) * 3.2).toFixed(2)}deg`,
      delay: `${(-((index * 0.61) % 4.2)).toFixed(2)}s`,
    };
  });
}

function clamp(value: number, min: number, max: number) {
  if (min > max) return (min + max) / 2;
  return Math.min(Math.max(value, min), max);
}

/* Bounds are measured from where the card is actually sitting rather than from
   its slot on the ring, so they hold whether the card is untouched, dragged, or
   nudged with the arrow keys. */
function getBoardBounds(card: HTMLElement, rendered: CardOffset) {
  const board = card.closest<HTMLElement>(".work__board");
  if (!board) return null;

  const boardRect = board.getBoundingClientRect();
  const cardRect = card.getBoundingClientRect();

  return {
    minX: rendered.x + (boardRect.left - BOARD_SLACK) - cardRect.left,
    maxX: rendered.x + (boardRect.right + BOARD_SLACK) - cardRect.right,
    minY: rendered.y + (boardRect.top - BOARD_SLACK) - cardRect.top,
    maxY: rendered.y + (boardRect.bottom + BOARD_SLACK) - cardRect.bottom,
  };
}

export function WorkConsole({
  data,
  contactEmail,
  interactive = true,
  onSelectProject,
}: Readonly<{
  data: Work;
  contactEmail: string;
  interactive?: boolean;
  /* Studio's admin preview is not interactive - a click there opens the
     project's own editor instead of the video, so onSelectProject stands in
     for setPreview. */
  onSelectProject?: (laneLabel: string, projectId: string) => void;
}>) {
  const [activeLane, setActiveLane] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewSelection | null>(null);
  // The globe and freeform canvas are desktop flourishes; a phone gets the
  // grid regardless of what's picked in the studio, so the board never reads
  // differently on the two surfaces.
  const [isMobile, setIsMobile] = useState(false);
  const [cardOffsets, setCardOffsets] = useState<Record<string, CardOffset>>({});
  const [cardStack, setCardStack] = useState<Record<string, number>>({});
  const [draggingId, setDraggingId] = useState<string | null>(null);
  // A LinkedIn thumbnail is fetched, not computed, so it can fail where a
  // YouTube one never does. Cards that fail here fall back to their gradient.
  const [failedThumbs, setFailedThumbs] = useState<Set<string>>(new Set());
  const boardRef = useRef<HTMLDivElement>(null);
  const stackTop = useRef(0);
  const drag = useRef<DragState | null>(null);
  const boardHintId = useId();
  const globeAxisRef = useRef<HTMLDivElement>(null);
  const globeFitRef = useRef<HTMLDivElement>(null);
  const globeRotation = useRef(0);
  const globeDrag = useRef<{
    active: boolean;
    moved: boolean;
    pointerId: number;
    startX: number;
    startRotation: number;
  } | null>(null);

  const allProjects = data.lanes.flatMap((lane) =>
    lane.projects.map((project) => ({ project, laneLabel: lane.label })),
  );
  /* Renaming a category in the studio would otherwise leave the filter pointing
     at a label that no longer exists, and the board would read as empty. */
  const selectedLane =
    activeLane && data.lanes.some((lane) => lane.label === activeLane) ? activeLane : null;
  const projects = selectedLane
    ? allProjects.filter(({ laneLabel }) => laneLabel === selectedLane)
    : allProjects;
  const hasMoved = Object.keys(cardOffsets).length > 0;
  const layout = getBoardLayout(projects.length);
  /* Only the unfiltered view honours the chosen layout; picking a category
     always falls back to the canvas. */
  const isGlobeView = selectedLane === null && !isMobile && data.allLayout === "globe";
  const isRailView = selectedLane === null && (isMobile || data.allLayout === "grid");
  const globe = isGlobeView ? getGlobeLayout(projects.length) : null;
  const globeSize = globe ? getGlobeSize(globe.placements, globe.perspective) : null;
  const globeWidth = globeSize?.width ?? 0;
  const globeHeight = globeSize?.height ?? 0;

  function resetBoard() {
    setCardOffsets({});
    setCardStack({});
    stackTop.current = 0;
  }

  /* Offsets are measured against a card's place on the ring, and filtering
     redraws the rings, so every filter starts from a tidy circle. */
  function filterProjects(laneLabel: string | null) {
    setActiveLane(laneLabel);
    setPreview(null);
    resetBoard();
  }

  function liftCard(id: string) {
    stackTop.current += 1;
    const top = stackTop.current;
    setCardStack((current) => ({ ...current, [id]: top }));
  }

  function startDrag(card: HTMLButtonElement, id: string, event: React.PointerEvent) {
    const base = cardOffsets[id] ?? { x: 0, y: 0 };
    const bounds = getBoardBounds(card, base);

    drag.current = {
      active: true,
      moved: false,
      id,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      baseX: base.x,
      baseY: base.y,
      x: base.x,
      y: base.y,
      minX: bounds?.minX ?? Number.NEGATIVE_INFINITY,
      maxX: bounds?.maxX ?? Number.POSITIVE_INFINITY,
      minY: bounds?.minY ?? Number.NEGATIVE_INFINITY,
      maxY: bounds?.maxY ?? Number.POSITIVE_INFINITY,
    };
    card.setPointerCapture(event.pointerId);
    setDraggingId(id);
    liftCard(id);
  }

  /* Touch starts a drag from the grip only: anywhere else on the card the
     browser keeps the gesture, so the page still scrolls under a finger. */
  function cardPointerDown(event: React.PointerEvent<HTMLButtonElement>, id: string) {
    if (event.pointerType === "touch" || event.button !== 0) return;
    startDrag(event.currentTarget, id, event);
  }

  function gripPointerDown(event: React.PointerEvent<HTMLSpanElement>, id: string) {
    const card = event.currentTarget.closest<HTMLButtonElement>(".work__card");
    if (!card || event.button !== 0) return;
    event.stopPropagation();
    startDrag(card, id, event);
  }

  /* The card is driven straight through its custom properties while the pointer
     is down: committing every move to state would re-render every card on the
     board, each of which carries a remote thumbnail. */
  function cardPointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    const state = drag.current;
    if (!state?.active || state.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - state.startX;
    const deltaY = event.clientY - state.startY;
    if (!state.moved && Math.abs(deltaX) + Math.abs(deltaY) > DRAG_THRESHOLD) state.moved = true;
    if (!state.moved) return;

    state.x = clamp(state.baseX + deltaX, state.minX, state.maxX);
    state.y = clamp(state.baseY + deltaY, state.minY, state.maxY);
    event.currentTarget.style.setProperty("--card-x", `${state.x}px`);
    event.currentTarget.style.setProperty("--card-y", `${state.y}px`);
  }

  function cardPointerUp(event: React.PointerEvent<HTMLButtonElement>) {
    const state = drag.current;
    if (!state?.active || state.pointerId !== event.pointerId) return;

    state.active = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setDraggingId(null);
    if (state.moved) {
      setCardOffsets((current) => ({ ...current, [state.id]: { x: state.x, y: state.y } }));
    }
  }

  function cardClick(project: WorkProject, laneLabel: string) {
    const state = drag.current;
    if (state?.moved) {
      state.moved = false;
      return;
    }
    if (!interactive) {
      onSelectProject?.(laneLabel, project.id);
      return;
    }
    setPreview({ project, laneLabel });
  }

  function cardKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, id: string) {
    const direction = NUDGE_KEYS[event.key];
    if (!direction) return;
    event.preventDefault();

    const step = NUDGE_STEP * (event.shiftKey ? 3 : 1);
    const base = cardOffsets[id] ?? { x: 0, y: 0 };
    const bounds = getBoardBounds(event.currentTarget, base);
    const nextX = base.x + direction.x * step;
    const nextY = base.y + direction.y * step;

    setCardOffsets((current) => ({
      ...current,
      [id]: {
        x: bounds ? clamp(nextX, bounds.minX, bounds.maxX) : nextX,
        y: bounds ? clamp(nextY, bounds.minY, bounds.maxY) : nextY,
      },
    }));
    liftCard(id);
  }

  useEffect(() => {
    // The page's viewport is pinned to the desktop width (see the public
    // layout), so window.innerWidth/matchMedia always read as desktop here.
    // screen.width still reflects the device's real size.
    const updateIsMobile = () => setIsMobile(window.screen.width <= 640);

    updateIsMobile();
    window.addEventListener("resize", updateIsMobile);
    window.addEventListener("orientationchange", updateIsMobile);
    return () => {
      window.removeEventListener("resize", updateIsMobile);
      window.removeEventListener("orientationchange", updateIsMobile);
    };
  }, []);

  /* The globe idles at a constant spin unless a drag is in progress, driven
     straight through the ref rather than state so the rotate loop doesn't
     re-render the whole card list every frame. */
  useEffect(() => {
    if (!isGlobeView) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const elapsed = now - last;
      last = now;
      if (!globeDrag.current?.active && !preview) {
        globeRotation.current = (globeRotation.current + elapsed * GLOBE_SPIN_DEG_PER_MS) % 360;
        if (globeAxisRef.current) {
          globeAxisRef.current.style.transform = `rotateX(${GLOBE_TILT_DEG}deg) rotateY(${globeRotation.current}deg)`;
        }
      }
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);

    return () => window.cancelAnimationFrame(frame);
  }, [isGlobeView, preview]);

  /* The globe is laid out once at a size of its own choosing, then scaled to
     whatever the board actually has room for - so a wide screen gets a bigger
     sphere rather than the same sphere adrift in empty space. */
  useEffect(() => {
    const board = boardRef.current;
    const fit = globeFitRef.current;
    if (!board || !fit || !globeWidth || !globeHeight) return;

    const apply = () => {
      /* A board with no size to report - a hidden tab, a print, a pane
         collapsed to nothing - would otherwise scale the globe to zero and
         leave it scaled to zero, since nothing resizes afterwards to put it
         right. Better to keep the last size that made sense. */
      if (!board.clientWidth || !board.clientHeight) return;

      const scale = Math.min(
        board.clientWidth / globeWidth,
        board.clientHeight / globeHeight,
        GLOBE_MAX_SCALE,
      );
      fit.style.setProperty("--globe-scale", scale.toFixed(4));
    };

    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(board);

    return () => observer.disconnect();
  }, [globeWidth, globeHeight]);

  function globePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    globeDrag.current = {
      active: true,
      moved: false,
      pointerId: event.pointerId,
      startX: event.clientX,
      startRotation: globeRotation.current,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function globePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const state = globeDrag.current;
    if (!state?.active || state.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - state.startX;
    if (!state.moved && Math.abs(deltaX) > DRAG_THRESHOLD) state.moved = true;
    if (!state.moved) return;

    globeRotation.current = state.startRotation + deltaX * GLOBE_DRAG_DEG_PER_PX;
    if (globeAxisRef.current) {
      globeAxisRef.current.style.transform = `rotateX(${GLOBE_TILT_DEG}deg) rotateY(${globeRotation.current}deg)`;
    }
  }

  function globePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    const state = globeDrag.current;
    if (!state?.active || state.pointerId !== event.pointerId) return;

    state.active = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  /* The face of a card - still, badge and caption - is the same whichever
     layout is holding it, so every layout draws it from here. */
  function cardFace(project: WorkProject, laneLabel: string, cardId: string, sizes: string) {
    const reel = resolveReel(project);
    const thumbnail = reelThumbnail(reel, failedThumbs.has(cardId));
    const badge = reelBadge(reel.kind);

    return (
      <span className="work__card-frame">
        <span className={`work__card-media ${project.thumbHint}`}>
          {thumbnail ? (
            <MediaImage
              src={thumbnail}
              alt={`${project.title} still`}
              fill
              sizes={sizes}
              unoptimized={reel.kind !== "youtube"}
              onError={
                reel.thumbnailCanFail
                  ? () =>
                      setFailedThumbs((current) =>
                        current.has(cardId) ? current : new Set(current).add(cardId),
                      )
                  : undefined
              }
            />
          ) : null}
          <span className="work__card-scrim" aria-hidden="true" />
          {/* With no fetched still to show, the badge grows into naming where
              the reel lives instead - the same spot a YouTube card uses for ▶. */}
          <span
            className={`work__card-play${badge.length > 1 && !thumbnail ? " work__card-play--post" : ""}`}
            aria-hidden="true"
          >
            {badge}
          </span>
        </span>
        <span className="work__card-body">
          <small>{laneLabel}</small>
          <b>{project.title}</b>
          <em>{project.subtitle}</em>
          <span className="work__card-open">
            Click to open <i>↗</i>
          </span>
        </span>
      </span>
    );
  }

  function globeCardClick(project: WorkProject, laneLabel: string) {
    if (globeDrag.current?.moved) {
      globeDrag.current.moved = false;
      return;
    }
    if (!interactive) {
      onSelectProject?.(laneLabel, project.id);
      return;
    }
    setPreview({ project, laneLabel });
  }

  useEffect(() => {
    if (!preview) return;

    window.requestAnimationFrame(() => {
      boardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPreview(null);
    };

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [preview]);

  const brief = `mailto:${contactEmail}?subject=${encodeURIComponent("Brief: Selected work")}`;
  const previewReel = preview ? resolveReel(preview.project) : null;

  return (
    <section className="work section" id="work">
      <div className="wrap">
        <header className="section-heading">
          <span className="slate">{data.eyebrow}</span>
          <h2>{data.heading}</h2>
          <p className="lede">{data.intro}</p>
        </header>
        <article className="work__panel work__panel--all">
          <div className="work__panel-head">
            <div className="work__panel-meta">
              <span>{selectedLane ?? data.allProjectsLabel}</span>
              <span>
                {projects.length} {data.videoCountLabel}
              </span>
            </div>
            <div className="work__filters" role="tablist" aria-label="Filter projects">
              <button
                type="button"
                role="tab"
                aria-selected={selectedLane === null}
                onClick={() => filterProjects(null)}
              >
                {data.allFilterLabel}
              </button>
              {data.lanes.map((lane) => (
                <button
                  type="button"
                  role="tab"
                  aria-selected={selectedLane === lane.label}
                  onClick={() => filterProjects(lane.label)}
                  key={lane.id}
                >
                  {lane.label}
                </button>
              ))}
            </div>
            <a className="work__brief" href={brief}>
              <span>{data.briefPrompt}</span>
              <strong>
                {data.briefCta} <i aria-hidden="true">↗</i>
              </strong>
            </a>
          </div>
          <div className="work__board-bar">
            <span className="work__board-hint">{data.canvasHint}</span>
            {/* Nothing on the globe or the rail can be moved out of place, so
                there is nothing there to put back. */}
            {isGlobeView || isRailView ? null : (
              <button
                type="button"
                className="work__board-reset"
                onClick={resetBoard}
                disabled={!hasMoved}
              >
                Reset layout
              </button>
            )}
          </div>
          <p className="sr-only" id={boardHintId}>
            Press Enter on a card to preview the video. Use the arrow keys to move a card around the
            board, or drag it with the pointer.
          </p>
          <div
            className={[
              "work__board",
              isGlobeView ? "work__board--globe" : "",
              isRailView ? "work__board--rail" : "",
              /* A long list on the canvas is drawn smaller: at full size the
                 cards cover more than the board has room for and bury one
                 another however evenly they are spread. */
              !isGlobeView && !isRailView && projects.length > BOARD_DENSE_FROM
                ? "work__board--dense"
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
            ref={boardRef}
            role="group"
            aria-label="Board of video projects"
            aria-describedby={boardHintId}
          >
            {projects.length === 0 ? (
              <p className="work__board-empty">Nothing pinned to this category yet.</p>
            ) : isGlobeView ? (
              <div
                className="work__globe-fit"
                ref={globeFitRef}
                style={
                  {
                    width: `${globeWidth}px`,
                    height: `${globeHeight}px`,
                    "--globe-card-w": `${GLOBE_CARD_W}px`,
                    "--globe-card-h": `${GLOBE_CARD_H}px`,
                    "--globe-perspective": `${Math.round(globe!.perspective)}px`,
                  } as React.CSSProperties
                }
              >
                <div
                  className="work__globe-stage"
                  onPointerDown={globePointerDown}
                  onPointerMove={globePointerMove}
                  onPointerUp={globePointerUp}
                  onPointerCancel={globePointerUp}
                >
                  <div
                    className="work__globe-axis"
                    ref={globeAxisRef}
                    style={{ transform: `rotateX(${GLOBE_TILT_DEG}deg)` }}
                  >
                    {projects.map(({ project, laneLabel }, index) => {
                      const cardId = `${laneLabel}-${project.id}`;
                      const place = globe!.placements[index]!;
                      const cardStyle: React.CSSProperties = {
                        transform: `translateY(${Math.round(place.y)}px) rotateY(${place.angle.toFixed(3)}deg) translateZ(${Math.round(place.radius)}px)`,
                      };

                      return (
                        <div className="work__globe-card" style={cardStyle} key={cardId}>
                          <button
                            type="button"
                            className="work__globe-card-btn"
                            onPointerDown={(event) => event.stopPropagation()}
                            onClick={() => globeCardClick(project, laneLabel)}
                            aria-label={`Preview ${project.title}`}
                          >
                            {cardFace(project, laneLabel, cardId, "220px")}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : isRailView ? (
              /* A horizontal grid that drifts sideways on its own. The cards
                 are laid twice so the drift can loop without a seam; the
                 second pass is scenery, hidden from anything that reads or
                 tabs through the page. */
              <div className="work__rail">
                <div className="work__rail-track">
                  {[false, true].map((echo) => (
                    <div
                      className="work__rail-grid"
                      key={echo ? "echo" : "cards"}
                      aria-hidden={echo || undefined}
                    >
                      {projects.map(({ project, laneLabel }) => {
                        const cardId = `${laneLabel}-${project.id}`;

                        return (
                          <button
                            type="button"
                            className="work__rail-card"
                            key={cardId}
                            tabIndex={echo ? -1 : undefined}
                            onClick={() => cardClick(project, laneLabel)}
                            aria-label={`Preview ${project.title}`}
                          >
                            {cardFace(project, laneLabel, cardId, "200px")}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              projects.map(({ project, laneLabel }, index) => {
                const cardId = `${laneLabel}-${project.id}`;
                const place = layout[index]!;
                const offset = cardOffsets[cardId];
                const lifted = cardStack[cardId];
                const cardStyle: BoardCardStyle = {
                  "--card-ox": place.ox,
                  "--card-oy": place.oy,
                  "--card-x": `${offset?.x ?? 0}px`,
                  "--card-y": `${offset?.y ?? 0}px`,
                  "--card-tilt": place.tilt,
                  "--card-delay": place.delay,
                  ...(lifted ? { zIndex: lifted } : {}),
                };
                const className = [
                  "work__card",
                  offset ? "is-moved" : "",
                  draggingId === cardId ? "is-dragging" : "",
                ]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <button
                    className={className}
                    style={cardStyle}
                    type="button"
                    key={cardId}
                    onPointerDown={(event) => cardPointerDown(event, cardId)}
                    onPointerMove={cardPointerMove}
                    onPointerUp={cardPointerUp}
                    onPointerCancel={cardPointerUp}
                    /* Pressing on the thumbnail would otherwise start the
                       browser's own image drag, which cancels the pointer
                       stream and leaves the card stuck where it was. */
                    onDragStart={(event) => event.preventDefault()}
                    onKeyDown={(event) => cardKeyDown(event, cardId)}
                    onClick={() => cardClick(project, laneLabel)}
                    aria-label={`Preview ${project.title}`}
                  >
                    {cardFace(project, laneLabel, cardId, "(max-width: 560px) 45vw, 190px")}
                    <span
                      className="work__card-grip"
                      title="Drag to move this card"
                      aria-hidden="true"
                      onPointerDown={(event) => gripPointerDown(event, cardId)}
                      onClick={(event) => event.stopPropagation()}
                    />
                  </button>
                );
              })
            )}
          </div>
          {preview ? (
            <>
              <div
                className="work__preview-scrim"
                aria-hidden="true"
                onClick={() => setPreview(null)}
              />
              <div
                className="work__preview"
                role="dialog"
                aria-modal="true"
                aria-label={`${preview.project.title} preview`}
              >
                <button
                  type="button"
                  className="work__preview-close"
                  onClick={() => setPreview(null)}
                  aria-label="Close video preview"
                >
                  &times;
                </button>
                <div
                  className={`work__preview-media work__preview-media--${previewReel?.kind ?? "none"}${
                    previewReel?.kind === "linkedin" || previewReel?.kind === "instagram"
                      ? " work__preview-media--post"
                      : ""
                  }`}
                >
                  {previewReel?.file ? (
                    <video
                      src={previewReel.file}
                      poster={previewReel.poster ?? undefined}
                      controls
                      autoPlay
                      playsInline
                    />
                  ) : previewReel?.embed ? (
                    <iframe
                      src={previewReel.embed}
                      title={`${preview.project.title} video`}
                      allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                    />
                  ) : (
                    <div className="work__preview-unavailable">
                      <span>{data.previewUnavailableLabel}</span>
                      {preview.project.href ? (
                        <a href={preview.project.href} target="_blank" rel="noreferrer">
                          Open {preview.project.hrefLabel ?? "project"}{" "}
                          <span aria-hidden="true">↗</span>
                        </a>
                      ) : null}
                    </div>
                  )}
                </div>
                <div className="work__preview-copy">
                  <small>{preview.laneLabel}</small>
                  <h3>{preview.project.title}</h3>
                  <p>{preview.project.subtitle}</p>
                  {preview.project.href ? (
                    <a href={preview.project.href} target="_blank" rel="noreferrer">
                      {preview.project.hrefLabel ?? "Watch full video"}{" "}
                      <span aria-hidden="true">&rarr;</span>
                    </a>
                  ) : null}
                </div>
              </div>
            </>
          ) : null}
        </article>
      </div>
    </section>
  );
}
