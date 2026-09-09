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

/* Cards ride concentric rings rather than a grid, so the board opens as a
   circle of stills with the middle left clear. Each ring fills before the next
   one starts; a board large enough to outrun the last ring simply packs it
   tighter, and every card can be dragged off its ring anyway. */
const RINGS: readonly (readonly [capacity: number, radius: number])[] = [
  [10, 1],
  [7, 0.6],
  [5, 0.28],
];
/* A handful of cards on the full-width ring reads as a scatter rather than a
   circle, so a short board draws its one ring in tighter. */
const SMALL_RING = 5;
const SMALL_RING_RADIUS = 0.66;

const NUDGE_KEYS: Readonly<Record<string, CardOffset>> = {
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
};

function getRingCounts(total: number) {
  const counts: number[] = [];
  let remaining = total;

  for (let ring = 0; ring < RINGS.length && remaining > 0; ring += 1) {
    const capacity = RINGS[ring]![0];
    const take = ring === RINGS.length - 1 ? remaining : Math.min(remaining, capacity);
    counts.push(take);
    remaining -= take;
  }

  return counts;
}

/* Where every card sits before anyone touches it, as a pair of offsets from
   the middle of the board between -1 and 1. How far that actually is stays in
   CSS, so a narrow screen can pull the whole ring in without this having to
   know the board's width. Each ring is turned half a step against the one
   outside it, so the cards interleave rather than line up into spokes, and the
   numbers are rounded because `Math.sin` can differ in its last digit between
   the server's runtime and the browser's, which is enough on its own to fail
   hydration. */
function getBoardLayout(total: number) {
  const placements: { ox: string; oy: string; tilt: string; delay: string }[] = [];
  let index = 0;

  getRingCounts(total).forEach((count, ring) => {
    const base = RINGS[ring]![1];
    const radius = ring === 0 && count < SMALL_RING ? SMALL_RING_RADIUS : base;
    const turn = ring % 2 ? Math.PI / count : 0;

    for (let slot = 0; slot < count; slot += 1) {
      const angle = -Math.PI / 2 + turn + (Math.PI * 2 * slot) / count;
      placements.push({
        ox: (Math.cos(angle) * radius).toFixed(4),
        oy: (Math.sin(angle) * radius).toFixed(4),
        tilt: `${(Math.sin(index * 12.9898) * 3.2).toFixed(2)}deg`,
        delay: `${(-((index * 0.61) % 4.2)).toFixed(2)}s`,
      });
      index += 1;
    }
  });

  return placements;
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
}: Readonly<{ data: Work; contactEmail: string }>) {
  const [activeLane, setActiveLane] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewSelection | null>(null);
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
            <button
              type="button"
              className="work__board-reset"
              onClick={resetBoard}
              disabled={!hasMoved}
            >
              Reset layout
            </button>
          </div>
          <p className="sr-only" id={boardHintId}>
            Press Enter on a card to preview the video. Use the arrow keys to move a card around the
            board, or drag it with the pointer.
          </p>
          <div
            className="work__board"
            ref={boardRef}
            role="group"
            aria-label="Board of video projects"
            aria-describedby={boardHintId}
          >
            {projects.length === 0 ? (
              <p className="work__board-empty">Nothing pinned to this category yet.</p>
            ) : (
              projects.map(({ project, laneLabel }, index) => {
                const cardId = `${laneLabel}-${project.id}`;
                const reel = resolveReel(project);
                const thumbnail = reelThumbnail(reel, failedThumbs.has(cardId));
                const badge = reelBadge(reel.kind);
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
                    <span className="work__card-frame">
                      <span className={`work__card-media ${project.thumbHint}`}>
                        {thumbnail ? (
                          <MediaImage
                            src={thumbnail}
                            alt={`${project.title} still`}
                            fill
                            sizes="(max-width: 560px) 45vw, 190px"
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
                        {/* With no fetched still to show, the badge grows into
                            naming where the reel lives instead - the same spot a
                            YouTube card uses for ▶. */}
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
                      </span>
                    </span>
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
