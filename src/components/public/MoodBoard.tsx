"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PlaceholderImage } from "@/components/public/PlaceholderImage";
import { placeholderImageUrl } from "@/lib/placeholders";
import type { Room } from "@/schemas";

type MoodBoardProps = Readonly<{ data: Room }>;
type Position = Pick<Room["cards"][number], "fx" | "fy" | "rot">;
type Direction = "left" | "right" | "up" | "down";

const keyboardStep = 0.05;
const safeBoardPosition = (value: number) => Math.min(0.78, Math.max(0.02, value));

function getCardLabel(card: Room["cards"][number]) {
  switch (card.type) {
    case "polaroid":
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

function cardContent(card: Room["cards"][number]) {
  switch (card.type) {
    case "polaroid": {
      const image = card.image ?? {
        url: placeholderImageUrl(card.caption),
        alt: `Placeholder photo for ${card.caption}`,
      };

      return (
        <>
          <span className={`mood-card__image ${card.tint}`}>
            <PlaceholderImage src={image.url} alt={image.alt} fill sizes="220px" />
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

export function MoodBoard({ data }: MoodBoardProps) {
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
    boardLeft: number;
    boardTop: number;
    boardWidth: number;
    boardHeight: number;
    cardWidth: number;
    cardHeight: number;
  } | null>(null);
  const [positions, setPositions] = useState<Record<string, Position>>(() =>
    Object.fromEntries(
      data.cards.map((card) => [card.id, { fx: card.fx, fy: card.fy, rot: card.rot }]),
    ),
  );
  const [dragged, setDragged] = useState<string | null>(null);
  const [isDesktopLayout, setIsDesktopLayout] = useState(false);
  const [moveAnnouncement, setMoveAnnouncement] = useState("");
  const canReposition = data.allowDrag && isDesktopLayout;

  const reset = useCallback(
    () =>
      setPositions(
        Object.fromEntries(
          data.cards.map((card) => [card.id, { fx: card.fx, fy: card.fy, rot: card.rot }]),
        ),
      ),
    [data.cards],
  );
  const shuffle = () =>
    setPositions(
      Object.fromEntries(
        data.cards.map((card) => [
          card.id,
          {
            fx: 0.04 + Math.random() * 0.66,
            fy: 0.04 + Math.random() * 0.66,
            rot: -6 + Math.random() * 12,
          },
        ]),
      ),
    );

  useEffect(() => {
    const desktopQuery = window.matchMedia("(min-width: 821px)");
    const updateLayout = () => setIsDesktopLayout(desktopQuery.matches);

    updateLayout();
    desktopQuery.addEventListener("change", updateLayout);
    return () => desktopQuery.removeEventListener("change", updateLayout);
  }, []);

  useEffect(() => {
    const finish = () => {
      const drag = dragRef.current;
      // Without this guard every pointerup anywhere on the page rebuilt the
      // whole position map and re-rendered the board.
      if (!drag) return;

      setPositions((current) => ({
        ...current,
        [drag.id]: {
          ...current[drag.id]!,
          fx: safeBoardPosition(drag.fx),
          fy: safeBoardPosition(drag.fy),
        },
      }));
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
    const position = positions[id];
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
      boardLeft: boardRect.left,
      boardTop: boardRect.top,
      boardWidth: board.clientWidth,
      boardHeight: board.clientHeight,
      cardWidth: card.offsetWidth,
      cardHeight: card.offsetHeight,
    };
    setDragged(id);
    card.setPointerCapture(event.pointerId);
  }

  // Positioned directly on the node while dragging, then committed to state on
  // pointerup: routing every move through state re-rendered all board cards.
  function pointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag) return;
    const x = Math.max(
      -drag.cardWidth * 0.6,
      Math.min(drag.boardWidth - drag.cardWidth * 0.4, event.clientX - drag.boardLeft - drag.grabX),
    );
    const y = Math.max(
      -drag.cardHeight * 0.6,
      Math.min(
        drag.boardHeight - drag.cardHeight * 0.4,
        event.clientY - drag.boardTop - drag.grabY,
      ),
    );
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

    event.preventDefault();
    setPositions((current) => ({
      ...current,
      [id]: {
        ...current[id]!,
        fx: safeBoardPosition(current[id]!.fx + nextMovement.fx),
        fy: safeBoardPosition(current[id]!.fy + nextMovement.fy),
      },
    }));
    setMoveAnnouncement(`Moved ${label} ${nextMovement.direction}.`);
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
            const position = positions[card.id]!;
            const label = getCardLabel(card);
            return (
              <div
                key={card.id}
                className={`mood-card mood-card--${card.type} mood-card--${card.pinType} ${dragged === card.id ? "is-dragging" : ""}`}
                style={{
                  left: `${position.fx * 100}%`,
                  top: `${position.fy * 100}%`,
                  rotate: `${position.rot}deg`,
                }}
                onPointerDown={(event) => pointerDown(event, card.id)}
                onPointerMove={pointerMove}
                onKeyDown={(event) => moveCardByKeyboard(event, card.id, label)}
                tabIndex={canReposition ? 0 : undefined}
                role={canReposition ? "group" : undefined}
                aria-label={canReposition ? `Reposition ${label}` : undefined}
                aria-describedby={canReposition ? "mood-board-instructions" : undefined}
                aria-roledescription={canReposition ? "draggable card" : undefined}
              >
                {cardContent(card)}
              </div>
            );
          })}
        </div>
      </section>
      <section className="room-close">
        <span className="slate">{data.closeEyebrow}</span>
        <h2>{data.closeHeading}</h2>
      </section>
    </main>
  );
}
