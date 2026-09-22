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

/* In the studio a dropped card's offset is saved into the draft as a new
   position; until that draft comes back round, the offset keeps the card
   where it was dropped. `base` is the position it was measured from, so it
   stops applying the moment the card's position changes underneath it. */
type LocalOffset = CardOffset & { base?: string };

type BoardPosition = WorkProject["position"];

type BoardCardStyle = React.CSSProperties & {
  "--card-ox": string;
  "--card-oy": string;
  "--card-x": string;
  "--card-y": string;
  "--card-delay": string;
  "--card-tilt": string;
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

/* Cards are dealt one to a cell of a grid, each cell a little bigger than a
   card, then jogged out of it - so the board reads as a loose scatter with a
   sliver of space between neighbours. */
const BOARD_ASPECT = 1.7;
/* One cell, in card widths. A card is about 1.05x as tall as it is wide.
   Saved positions are in cells too, so they scale with the card size. */
const BOARD_STEP_X = 1.2;
const BOARD_STEP_Y = 1.3;
/* How far out of its cell a card may be jogged, as a share of the cell. Enough
   that the grid behind the scatter can't be read; two neighbours jogged
   towards each other may tuck under an edge, never cover one another. */
const BOARD_JOG = 0.4;
/* Every other row slides half-way across by this share of a cell, brick
   fashion, so the columns don't line up. */
const BOARD_STAGGER = 0.25;
/* Largest tilt either way, in degrees. */
const BOARD_TILT = 4;
/* Past this many cards the board is being asked to hold more than it has room
   for, and they are drawn smaller rather than left to bury one another. */
const BOARD_DENSE_FROM = 28;

const NUDGE_KEYS: Readonly<Record<string, CardOffset>> = {
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
};

/* Where every card sits before anyone touches it, as offsets from the middle
   of the board in cells. The numbers are rounded because `Math.sin` can differ in its last
   digit between the server's runtime and the browser's, which is enough on
   its own to fail hydration. */
/* Stands in for a random number without being one: the same card is jogged the
   same way on the server and in the browser, which a real random would not be. */
function boardNoise(seed: number) {
  const value = Math.sin(seed * 127.1) * 43758.5453;
  return value - Math.floor(value);
}

function boardColumns(total: number) {
  return Math.max(1, Math.round(Math.sqrt(total * BOARD_ASPECT)));
}

function getBoardLayout(total: number) {
  const columns = boardColumns(total);
  const rows = Math.ceil(total / columns);
  const jog = (seed: number) => (boardNoise(seed) - 0.5) * BOARD_JOG;

  return Array.from({ length: total }, (_, index) => {
    const row = Math.floor(index / columns);
    /* The last row is usually short; centring it keeps the pile compact. */
    const inRow = Math.min(columns, total - row * columns);

    return {
      ox: (
        (index % columns) -
        (inRow - 1) / 2 +
        (row % 2 ? BOARD_STAGGER : -BOARD_STAGGER) +
        jog(index + 1)
      ).toFixed(4),
      oy: (row - (rows - 1) / 2 + jog(index + 91)).toFixed(4),
      tilt: `${(jog(index + 37) * (2 / BOARD_JOG) * BOARD_TILT).toFixed(2)}deg`,
      delay: `${(-((index * 0.61) % 4.2)).toFixed(2)}s`,
    };
  });
}

/* Every project across the categories, in the order "All work" shows them:
   the studio's saved order first, then anything not in it (new projects) in
   category order. The studio reorders with this too, so both agree. */
export function orderAllProjects(data: Pick<Work, "lanes" | "allOrder">) {
  const rank = new Map(data.allOrder.map((id, index) => [id, index]));
  return data.lanes
    .flatMap((lane) => lane.projects.map((project) => ({ project, laneLabel: lane.label })))
    .map((entry, index) => ({ entry, index, rank: rank.get(entry.project.id) ?? Infinity }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map(({ entry }) => entry);
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
  onMoveProject,
  onReorderProjects,
}: Readonly<{
  data: Work;
  contactEmail: string;
  interactive?: boolean;
  /* Studio's admin preview is not interactive - a click there opens the
     project's own editor instead of the video, so onSelectProject stands in
     for setPreview. */
  onSelectProject?: (laneLabel: string, projectId: string) => void;
  /* Studio only: a card dropped on the canvas saves its position (in cells)
     into the draft, and null puts it back on its computed spot. */
  onMoveProject?: (laneLabel: string, projectId: string, position: BoardPosition) => void;
  /* Studio only: a grid card dropped on another takes its place. `laneLabel`
     is null on "All work", whose order is kept apart from the categories. */
  onReorderProjects?: (laneLabel: string | null, fromId: string, toId: string) => void;
}>) {
  const [activeLane, setActiveLane] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewSelection | null>(null);
  // The freeform canvas is a desktop flourish; a phone always gets the grid.
  const [isMobile, setIsMobile] = useState(false);
  const [cardOffsets, setCardOffsets] = useState<Record<string, LocalOffset>>({});
  const [cardStack, setCardStack] = useState<Record<string, number>>({});
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [railDrag, setRailDrag] = useState<{ from: string; over: string | null } | null>(null);
  // A LinkedIn thumbnail is fetched, not computed, so it can fail where a
  // YouTube one never does. Cards that fail here fall back to their gradient.
  const [failedThumbs, setFailedThumbs] = useState<Set<string>>(new Set());
  const boardRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const stackTop = useRef(0);
  const drag = useRef<DragState | null>(null);
  const boardHintId = useId();
  const allProjects = orderAllProjects(data);
  /* Renaming a category in the studio would otherwise leave the filter pointing
     at a label that no longer exists, and the board would read as empty. */
  const selectedLane =
    activeLane && data.lanes.some((lane) => lane.label === activeLane) ? activeLane : null;
  const projects = selectedLane
    ? allProjects.filter(({ laneLabel }) => laneLabel === selectedLane)
    : allProjects;
  const layout = getBoardLayout(projects.length);
  /* A saved position replaces the computed one outright, so adding a project
     to the category never shifts a card that was placed by hand. */
  const places = projects.map(({ project }, index) => {
    const place = layout[index]!;
    const ox = project.position ? project.position.x.toFixed(4) : place.ox;
    const oy = project.position ? project.position.y.toFixed(4) : place.oy;
    return { ...place, ox, oy, key: `${ox},${oy}` };
  });
  const placeById = new Map(
    projects.map(({ project, laneLabel }, index) => [
      `${laneLabel}-${project.id}`,
      { project, laneLabel, place: places[index]! },
    ]),
  );
  const placeKeys = places.map((place) => place.key).join("|");
  function offsetFor(id: string): LocalOffset | undefined {
    const offset = cardOffsets[id];
    if (!offset) return undefined;
    return !offset.base || offset.base === placeById.get(id)?.place.key ? offset : undefined;
  }
  const hasMoved =
    Object.keys(cardOffsets).some((id) => offsetFor(id)) ||
    (!!onMoveProject && projects.some(({ project }) => project.position));
  /* "All work" is always the drifting grid; a category shows whichever
     layout the studio picked for it. Phones get the grid either way. */
  const lane = data.lanes.find((entry) => entry.label === selectedLane);
  const isRailView = isMobile || !lane || lane.layout === "grid";

  /* Once any position changes, drop offsets whose saved position has landed,
     so a later Discard doesn't bring them back. */
  const [seenPlaceKeys, setSeenPlaceKeys] = useState(placeKeys);
  if (seenPlaceKeys !== placeKeys) {
    setSeenPlaceKeys(placeKeys);
    setCardOffsets((current) =>
      Object.fromEntries(
        Object.entries(current).filter(
          ([id, offset]) => !offset.base || offset.base === placeById.get(id)?.place.key,
        ),
      ),
    );
  }

  /* Visitors' moves stay on their screen; in the studio the move is turned
     into cells and written into the draft. */
  function placeCard(id: string, offset: CardOffset, card: HTMLElement) {
    const entry = placeById.get(id);
    if (!onMoveProject || !entry) {
      setCardOffsets((current) => ({ ...current, [id]: offset }));
      return;
    }
    const width = card.offsetWidth || 1;
    const round = (value: number) => Math.round(value * 1000) / 1000;
    setCardOffsets((current) => ({ ...current, [id]: { ...offset, base: entry.place.key } }));
    onMoveProject(entry.laneLabel, entry.project.id, {
      x: round(Number(entry.place.ox) + offset.x / (width * BOARD_STEP_X)),
      y: round(Number(entry.place.oy) + offset.y / (width * BOARD_STEP_Y)),
    });
  }

  function resetLayout() {
    if (onMoveProject) {
      projects.forEach(({ project, laneLabel }) => {
        if (project.position) onMoveProject(laneLabel, project.id, null);
      });
    }
    resetBoard();
  }

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
    const base = offsetFor(id) ?? { x: 0, y: 0 };
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
    if (state.moved) placeCard(state.id, { x: state.x, y: state.y }, event.currentTarget);
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
    const base = offsetFor(id) ?? { x: 0, y: 0 };
    const bounds = getBoardBounds(event.currentTarget, base);
    const nextX = base.x + direction.x * step;
    const nextY = base.y + direction.y * step;

    placeCard(
      id,
      {
        x: bounds ? clamp(nextX, bounds.minX, bounds.maxX) : nextX,
        y: bounds ? clamp(nextY, bounds.minY, bounds.maxY) : nextY,
      },
      event.currentTarget,
    );
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
    <section className="work section" id="work" data-studio-hooks={interactive ? undefined : ""}>
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
            {/* Nothing on the rail can be moved out of place, so there is
                nothing there to put back. In the studio the rail stands
                still, so it gets buttons to page through instead. */}
            {isRailView ? (
              onReorderProjects ? (
                <span className="work__rail-nav">
                  {[-1, 1].map((direction) => (
                    <button
                      type="button"
                      className="work__board-reset"
                      key={direction}
                      aria-label={direction < 0 ? "Scroll cards left" : "Scroll cards right"}
                      onClick={() =>
                        railRef.current?.scrollBy({
                          left: direction * railRef.current.clientWidth * 0.8,
                          behavior: "smooth",
                        })
                      }
                    >
                      {direction < 0 ? "‹" : "›"}
                    </button>
                  ))}
                </span>
              ) : null
            ) : (
              <button
                type="button"
                className="work__board-reset"
                onClick={resetLayout}
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
              isRailView ? "work__board--rail" : "",
              /* A long list on the canvas is drawn smaller: at full size the
                 cards cover more than the board has room for and bury one
                 another however evenly they are spread. */
              !isRailView && projects.length > BOARD_DENSE_FROM ? "work__board--dense" : "",
              /* In the studio a drop is saved and re-rendered from the draft;
                 an easing transform would slide the card through its old spot. */
              onMoveProject || onReorderProjects ? "work__board--editing" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            ref={boardRef}
            /* The board grows with the rows so the spacing never gets
               squeezed by the edge clamp. */
            style={
              {
                "--board-rows": Math.ceil(projects.length / boardColumns(projects.length)),
                "--board-step-x": `calc(var(--card-w) * ${BOARD_STEP_X})`,
                "--board-step-y": `calc(var(--card-w) * ${BOARD_STEP_Y})`,
              } as React.CSSProperties
            }
            role="group"
            aria-label="Board of video projects"
            aria-describedby={boardHintId}
          >
            {projects.length === 0 ? (
              <p className="work__board-empty">Nothing pinned to this category yet.</p>
            ) : isRailView ? (
              /* A horizontal grid that drifts sideways on its own. The cards
                 are laid twice so the drift can loop without a seam; the
                 second pass is scenery, hidden from anything that reads or
                 tabs through the page. */
              <div className="work__rail" ref={railRef}>
                <div className="work__rail-track">
                  {/* The echo only exists for the drift loop, which the studio stops. */}
                  {(onReorderProjects ? [false] : [false, true]).map((echo) => (
                    <div
                      className="work__rail-grid"
                      key={echo ? "echo" : "cards"}
                      aria-hidden={echo || undefined}
                    >
                      {projects.map(({ project, laneLabel }) => {
                        const cardId = `${laneLabel}-${project.id}`;

                        const canReorder = !!onReorderProjects && !echo;

                        return (
                          <button
                            type="button"
                            className={[
                              "work__rail-card",
                              canReorder && railDrag?.from === project.id ? "is-dragging" : "",
                              canReorder &&
                              railDrag?.over === project.id &&
                              railDrag.from !== project.id
                                ? "is-drop-target"
                                : "",
                            ]
                              .filter(Boolean)
                              .join(" ")}
                            key={cardId}
                            tabIndex={echo ? -1 : undefined}
                            onClick={() => cardClick(project, laneLabel)}
                            aria-label={`Preview ${project.title}`}
                            {...(canReorder
                              ? {
                                  draggable: true,
                                  onDragStart: (event: React.DragEvent) => {
                                    event.dataTransfer.effectAllowed = "move";
                                    // Firefox will not start a drag without data set.
                                    event.dataTransfer.setData("text/plain", project.id);
                                    setRailDrag({ from: project.id, over: null });
                                  },
                                  onDragOver: (event: React.DragEvent) => {
                                    event.preventDefault();
                                    if (railDrag && railDrag.over !== project.id) {
                                      setRailDrag({ ...railDrag, over: project.id });
                                    }
                                  },
                                  onDrop: (event: React.DragEvent) => {
                                    event.preventDefault();
                                    if (railDrag && railDrag.from !== project.id) {
                                      onReorderProjects(selectedLane, railDrag.from, project.id);
                                    }
                                  },
                                  onDragEnd: () => setRailDrag(null),
                                }
                              : {})}
                          >
                            {cardFace(project, laneLabel, cardId, "200px")}
                          </button>
                        );
                      })}
                      {/* grid-auto-flow: column always reserves a full 3-row
                          last column, so a count not divisible by 3 leaves
                          empty cells showing the grid's own background - a
                          stray gray block instead of the hairline it's meant
                          for. Fillers just occupy those cells. */}
                      {Array.from({ length: (3 - (projects.length % 3)) % 3 }, (_, i) => (
                        <span key={`fill-${i}`} className="work__rail-filler" aria-hidden="true" />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              projects.map(({ project, laneLabel }, index) => {
                const cardId = `${laneLabel}-${project.id}`;
                const place = places[index]!;
                const offset = offsetFor(cardId);
                const lifted = cardStack[cardId];
                const cardStyle: BoardCardStyle = {
                  "--card-ox": place.ox,
                  "--card-oy": place.oy,
                  "--card-x": `${offset?.x ?? 0}px`,
                  "--card-y": `${offset?.y ?? 0}px`,
                  "--card-delay": place.delay,
                  "--card-tilt": place.tilt,
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
