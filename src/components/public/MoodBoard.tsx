"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { HOME_SCROLL_KEY, RESTORE_HOME_SCROLL_KEY } from "@/components/public/Nav";
import { MediaImage } from "@/components/public/MediaImage";
import { imageOrFallback, type FallbackImage } from "@/lib/placeholders";
import { EMBED_SANDBOX, reelBadge, reelSourceLabel, resolveReel } from "@/lib/reel";
import { useDialogFocus } from "@/lib/use-dialog-focus";
import type { Contact, Room } from "@/schemas";

type MoodBoardProps = Readonly<{ data: Room; fallbackImage?: FallbackImage; contact: Contact }>;
type Position = Pick<Room["cards"][number], "fx" | "fy" | "rot">;
type RoomCard = Room["cards"][number];
type VideoCard = Extract<RoomCard, { type: "video" }>;
type Direction = "left" | "right" | "up" | "down";

const keyboardStep = 0.05;
const safeBoardPosition = (value: number) => Math.min(0.78, Math.max(0.02, value));

function getCardLabel(card: Room["cards"][number]) {
  switch (card.type) {
    case "polaroid":
    case "video":
      return card.caption;
    case "note":
    case "quote":
      return card.text;
    case "ig":
      return card.handle;
    case "tags":
      return card.kicker;
  }
}

/* The face of a reel card: the reel's own still where the link or upload brings
   one, the editor's chosen photo where they set one, and nothing at all
   otherwise. Resolved through the same helper the work board uses, so a link
   pinned here behaves exactly as it does there. */
function videoCardFace(card: VideoCard, fallbackImage: FallbackImage) {
  const reel = resolveReel(card);
  if (!reel.thumbnail) {
    // The stand-in is not a still from this video, so it is decorative.
    return fallbackImage ? { url: fallbackImage.url, alt: "", remote: false } : null;
  }

  return {
    url: reel.thumbnail,
    alt: card.image?.alt || (card.caption.trim() ? `Still from ${card.caption.trim()}` : ""),
    remote: reel.thumbnail !== reel.cover,
  };
}

function cardContent(card: Room["cards"][number], fallbackImage: FallbackImage) {
  switch (card.type) {
    case "video": {
      const face = videoCardFace(card, fallbackImage);

      return (
        <>
          {/* No still to show is the tint wash on its own - the card still reads
              as a reel through its label and play badge. */}
          <span className={`mood-card__image ${card.tint}`}>
            {face ? (
              <MediaImage
                src={face.url}
                alt={face.alt}
                fill
                sizes="220px"
                unoptimized={face.remote}
              />
            ) : null}
            <span className="mood-card__image-label">{card.tag}</span>
            <span className="mood-card__play" aria-hidden="true">
              {reelBadge(resolveReel(card).kind)}
            </span>
          </span>
          <b>{card.caption}</b>
          <small>{card.subCaption}</small>
        </>
      );
    }
    case "polaroid": {
      const image = imageOrFallback(card.image, fallbackImage, card.caption);

      return (
        <>
          <span className={`mood-card__image ${card.tint}`}>
            {image ? <MediaImage src={image.url} alt={image.alt} fill sizes="220px" /> : null}
            <span className="mood-card__image-label">{card.tag}</span>
          </span>
          <b>{card.caption}</b>
          <small>{card.subCaption}</small>
        </>
      );
    }
    case "note":
      return (
        <>
          <small>{card.kicker}</small>
          <b>{card.text}</b>
        </>
      );
    case "quote":
      return (
        <>
          <blockquote>&quot;{card.text}&quot;</blockquote>
          <small>- {card.attribution}</small>
        </>
      );
    case "ig":
      return (
        <>
          <b>{card.handle}</b>
          <span className="mood-card__tiles">
            {card.tiles.map((tile, index) => (
              <i className={tile} key={`${tile}-${index}`} />
            ))}
          </span>
          <a href={card.ctaHref} target="_blank" rel="noreferrer">
            {card.ctaLabel}
          </a>
        </>
      );
    case "tags":
      return (
        <>
          <small>{card.kicker}</small>
          <span className="mood-card__tags">
            {card.tags.map((tag) => (
              <i className={tag.tint} key={tag.label}>
                {tag.label}
              </i>
            ))}
          </span>
        </>
      );
  }
}

type ViewableCard = VideoCard | Extract<RoomCard, { type: "polaroid" }>;

/* Opens whatever a card holds, full size: a reel plays in place, a photo is shown
   whole. Portrait media (Instagram, LinkedIn, photos) sits beside its caption so
   the frame is never lost in a wide, empty box. */
function CardViewer({
  card,
  fallbackImage,
  onClose,
}: Readonly<{ card: ViewableCard; fallbackImage: FallbackImage; onClose: () => void }>) {
  const reel = card.type === "video" ? resolveReel(card) : null;
  const photo = card.type === "polaroid" ? imageOrFallback(card.image, fallbackImage, card.caption) : null;
  const kind = reel ? reel.kind : "photo";
  const source = reel ? reelSourceLabel(reel.kind) : "Photograph";
  const outbound = card.type === "video" ? card.href : null;
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocus(dialogRef, true);

  return (
    <>
      <div className="mood-player__scrim" aria-hidden="true" onClick={onClose} />
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={`mood-player mood-player--${kind}`}
        role="dialog"
        aria-modal="true"
        aria-label={`${card.caption} preview`}
      >
        <button className="mood-player__close" type="button" onClick={onClose} aria-label="Close preview">
          &times;
        </button>
        <div className={`mood-player__media mood-player__media--${kind}`}>
          {photo ? (
            // Nominal size only: the CSS lets the photo take its own natural shape.
            <MediaImage
              src={photo.url}
              alt={photo.alt}
              width={1600}
              height={1200}
              sizes="(max-width: 820px) 92vw, min(64vw, 820px)"
            />
          ) : reel?.file ? (
            <video src={reel.file} poster={reel.poster ?? undefined} controls autoPlay playsInline />
          ) : reel?.embed ? (
            <iframe
              src={reel.embed}
              title={`${card.caption} video`}
              scrolling="no"
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share"
              sandbox={EMBED_SANDBOX}
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          ) : (
            <div className="mood-player__unavailable">
              <span>This card has no video that can play here yet.</span>
            </div>
          )}
        </div>
        <div className="mood-player__copy">
          <span className="mood-player__source">
            <i aria-hidden="true" />
            {source}
          </span>
          <small>{card.tag}</small>
          <h3>{card.caption}</h3>
          {card.subCaption ? <p>{card.subCaption}</p> : null}
          {outbound ? (
            <a className="mood-player__cta" href={outbound} target="_blank" rel="noreferrer">
              {reel?.kind === "instagram" ? "Watch on Instagram" : "Open original"}{" "}
              <span aria-hidden="true">&#8599;</span>
            </a>
          ) : null}
          <span className="mood-player__hint" aria-hidden="true">
            Esc to close
          </span>
        </div>
      </div>
    </>
  );
}

export function MoodBoard({ data, fallbackImage = null, contact }: MoodBoardProps) {
  const router = useRouter();
  const boardRef = useRef<HTMLDivElement>(null);
  // The board and card geometry is measured once per drag; re-measuring on
  // every pointer move forced a layout on each event.
  const dragRef = useRef<{
    id: string;
    node: HTMLDivElement;
    grabX: number;
    grabY: number;
    fx: number;
    fy: number;
    rot: number;
    boardLeft: number;
    boardTop: number;
    boardWidth: number;
    boardHeight: number;
    cardWidth: number;
    cardHeight: number;
    grabStartX: number;
    grabStartY: number;
    moved: boolean;
  } | null>(null);
  /* Only the cards someone has actually moved live in state. Every other card
     reads its place straight off the data, so a card added, removed or renamed
     in the studio never leaves a hole here for the board to trip over. */
  const [positions, setPositions] = useState<Record<string, Position>>({});
  const positionOf = (card: Room["cards"][number]) =>
    positions[card.id] ?? { fx: card.fx, fy: card.fy, rot: card.rot };
  const [dragged, setDragged] = useState<string | null>(null);
  const [playing, setPlaying] = useState<ViewableCard | null>(null);
  /* A card is dragged and clicked with the same button, and the click lands after
     the drag has finished. Without this the pop-up opened every time a reel card
     was moved. */
  const draggedRatherThanClicked = useRef(false);
  const [isDesktopLayout, setIsDesktopLayout] = useState(false);
  const [moveAnnouncement, setMoveAnnouncement] = useState("");
  const canReposition = data.allowDrag && isDesktopLayout;

  const reset = useCallback(() => setPositions({}), []);
  /* Cards are dealt one to a cell of a notional grid, which cell they get
     decided at random, and then jogged about inside it. Drawing each position
     at random instead piles three cards into one corner and leaves a hole
     beside it - the clumping a shuffle is meant to undo. */
  const shuffle = useCallback(() => {
    const columns = Math.ceil(Math.sqrt(data.cards.length));
    const rows = Math.ceil(data.cards.length / columns);
    const cells = data.cards.map((_, index) => index);

    for (let index = cells.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(Math.random() * (index + 1));
      [cells[index], cells[swap]] = [cells[swap]!, cells[index]!];
    }

    setPositions(
      Object.fromEntries(
        data.cards.map((card, index) => {
          const cell = cells[index]!;
          const jog = (place: number, count: number) =>
            0.04 + ((place + 0.15 + Math.random() * 0.7) / count) * 0.66;

          return [
            card.id,
            {
              fx: jog(cell % columns, columns),
              fy: jog(Math.floor(cell / columns), rows),
              rot: -6 + Math.random() * 12,
            },
          ];
        }),
      ),
    );
  }, [data.cards]);

  // Deals a fresh layout every time the room is opened, instead of reusing
  // whatever fx/fy the cards were last saved with.
  useEffect(() => {
    // Random positions can only be drawn after hydration, or server and client markup disagree.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    shuffle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const desktopQuery = window.matchMedia("(min-width: 821px)");
    const updateLayout = () => setIsDesktopLayout(desktopQuery.matches);

    updateLayout();
    desktopQuery.addEventListener("change", updateLayout);
    return () => desktopQuery.removeEventListener("change", updateLayout);
  }, []);

  useEffect(() => {
    if (!playing) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPlaying(null);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [playing]);

  useEffect(() => {
    const finish = () => {
      const drag = dragRef.current;
      // Without this guard every pointerup anywhere on the page rebuilt the
      // whole position map and re-rendered the board.
      if (!drag) return;

      setPositions((current) => ({
        ...current,
        [drag.id]: {
          rot: drag.rot,
          fx: safeBoardPosition(drag.fx),
          fy: safeBoardPosition(drag.fy),
        },
      }));
      draggedRatherThanClicked.current = drag.moved;
      dragRef.current = null;
      setDragged(null);
    };
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", finish);
    return () => {
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
    };
  }, []);

  function pointerDown(event: React.PointerEvent<HTMLDivElement>, id: string) {
    const board = boardRef.current;
    const boardCard = data.cards.find((entry) => entry.id === id);
    const position = boardCard ? positionOf(boardCard) : undefined;
    if (!canReposition || !board || !position) return;
    const card = event.currentTarget;
    const rect = card.getBoundingClientRect();
    const boardRect = board.getBoundingClientRect();
    dragRef.current = {
      id,
      node: card,
      grabX: event.clientX - rect.left,
      grabY: event.clientY - rect.top,
      fx: position.fx,
      fy: position.fy,
      rot: position.rot,
      boardLeft: boardRect.left,
      boardTop: boardRect.top,
      boardWidth: board.clientWidth,
      boardHeight: board.clientHeight,
      cardWidth: card.offsetWidth,
      cardHeight: card.offsetHeight,
      grabStartX: rect.left - boardRect.left,
      grabStartY: rect.top - boardRect.top,
      moved: false,
    };
    setDragged(id);
    card.setPointerCapture(event.pointerId);
  }

  // Positioned directly on the node while dragging, then committed to state on
  // pointerup: routing every move through state re-rendered all board cards.
  function pointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag) return;
    // Kept fully inside the board: the board clips overflow, so any overhang
    // here was invisible anyway - it just cut the card off mid-drag.
    const x = Math.max(
      0,
      Math.min(drag.boardWidth - drag.cardWidth, event.clientX - drag.boardLeft - drag.grabX),
    );
    const y = Math.max(
      0,
      Math.min(drag.boardHeight - drag.cardHeight, event.clientY - drag.boardTop - drag.grabY),
    );
    if (Math.abs(x - drag.grabStartX) + Math.abs(y - drag.grabStartY) > 4) drag.moved = true;
    drag.fx = x / Math.max(1, drag.boardWidth);
    drag.fy = y / Math.max(1, drag.boardHeight);
    drag.node.style.left = `${drag.fx * 100}%`;
    drag.node.style.top = `${drag.fy * 100}%`;
  }

  function moveCardByKeyboard(
    event: React.KeyboardEvent<HTMLDivElement>,
    id: string,
    label: string,
  ) {
    if (!canReposition || event.target !== event.currentTarget) return;

    const movement: Record<string, Readonly<{ direction: Direction; fx: number; fy: number }>> = {
      ArrowLeft: { direction: "left", fx: -keyboardStep, fy: 0 },
      ArrowRight: { direction: "right", fx: keyboardStep, fy: 0 },
      ArrowUp: { direction: "up", fx: 0, fy: -keyboardStep },
      ArrowDown: { direction: "down", fx: 0, fy: keyboardStep },
    };
    const nextMovement = movement[event.key];

    if (!nextMovement) return;

    const card = data.cards.find((entry) => entry.id === id);
    if (!card) return;

    event.preventDefault();
    setPositions((current) => {
      const base = current[id] ?? { fx: card.fx, fy: card.fy, rot: card.rot };
      return {
        ...current,
        [id]: {
          rot: base.rot,
          fx: safeBoardPosition(base.fx + nextMovement.fx),
          fy: safeBoardPosition(base.fy + nextMovement.fy),
        },
      };
    });
    setMoveAnnouncement(`Moved ${label} ${nextMovement.direction}.`);
  }

  const isViewable = (card: RoomCard): card is ViewableCard =>
    card.type === "video" ||
    (card.type === "polaroid" && !!imageOrFallback(card.image, fallbackImage, card.caption));

  function openCard(card: RoomCard) {
    if (!isViewable(card)) return;
    if (draggedRatherThanClicked.current) {
      draggedRatherThanClicked.current = false;
      return;
    }
    setPlaying(card);
  }

  /* Hands the landing page the spot it should land back on, saved by Nav while
     the visitor was there; arriving directly (a shared link, a refresh) leaves
     nothing saved, so the landing page opens on the hero as usual. */
  function goHome() {
    const savedScroll = sessionStorage.getItem(HOME_SCROLL_KEY);
    if (savedScroll) sessionStorage.setItem(RESTORE_HOME_SCROLL_KEY, savedScroll);
    router.push("/");
  }

  return (
    <main className="room-page">
      <section className="room-hero">
        <div className="wrap">
          <span className="slate">{data.eyebrow}</span>
          <h1>{data.title}</h1>
          <p>{data.intro}</p>
          {data.showShuffle ? (
            <div>
              <button type="button" onClick={shuffle}>
                {data.shuffleLabel}
              </button>
              <button type="button" onClick={reset}>
                {data.resetLabel}
              </button>
            </div>
          ) : null}
        </div>
      </section>
      <section className="wrap">
        <div className="mood-board" ref={boardRef}>
          <p className="sr-only" id="mood-board-instructions">
            On larger screens, focus a card and use the arrow keys to reposition it.
          </p>
          <p className="sr-only" aria-live="polite" aria-atomic="true">
            {moveAnnouncement}
          </p>
          {data.cards.map((card) => {
            const position = positionOf(card);
            const label = getCardLabel(card);
            const viewable = isViewable(card);
            return (
              <div
                key={card.id}
                className={`mood-card mood-card--${card.type} mood-card--${card.pinType} ${viewable ? "is-viewable" : ""} ${dragged === card.id ? "is-dragging" : ""}`}
                style={{
                  left: `${position.fx * 100}%`,
                  top: `${position.fy * 100}%`,
                  rotate: `${position.rot}deg`,
                }}
                onPointerDown={(event) => pointerDown(event, card.id)}
                onPointerMove={pointerMove}
                onClick={() => openCard(card)}
                onKeyDown={(event) => {
                  if (viewable && (event.key === "Enter" || event.key === " ")) {
                    event.preventDefault();
                    setPlaying(card);
                    return;
                  }
                  moveCardByKeyboard(event, card.id, label);
                }}
                tabIndex={canReposition || viewable ? 0 : undefined}
                role={viewable ? "button" : canReposition ? "group" : undefined}
                aria-label={
                  viewable
                    ? `${card.type === "video" ? "Play" : "View"} ${label}`
                    : canReposition
                      ? `Reposition ${label}`
                      : undefined
                }
                aria-describedby={canReposition ? "mood-board-instructions" : undefined}
                aria-roledescription={canReposition ? "draggable card" : undefined}
              >
                {cardContent(card, fallbackImage)}
              </div>
            );
          })}
        </div>
      </section>
      {playing ? (
        <CardViewer card={playing} fallbackImage={fallbackImage} onClose={() => setPlaying(null)} />
      ) : null}
      <section className="room-close">
        <span className="slate">{data.closeEyebrow}</span>
        <h2>{data.closeHeading}</h2>
        <div className="room-close__actions">
          <button type="button" className="drawing-teaser__link" onClick={goHome}>
            {data.closeCtaLabel} <span aria-hidden="true">&larr;</span>
          </button>
          <a
            className="drawing-teaser__link"
            href={`mailto:${contact.email}?subject=Project%20enquiry`}
          >
            {contact.projectCtaLabel} <span aria-hidden="true">&rarr;</span>
          </a>
        </div>
      </section>
    </main>
  );
}
