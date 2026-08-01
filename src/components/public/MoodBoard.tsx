"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Room } from "@/schemas";

type MoodBoardProps = Readonly<{ data: Room }>;
type Position = Pick<Room["cards"][number], "fx" | "fy" | "rot">;

function cardContent(card: Room["cards"][number]) {
  switch (card.type) {
    case "polaroid":
      return (
        <>
          <span className={`mood-card__image ${card.tint}`}>{card.tag}</span>
          <b>{card.caption}</b>
          <small>{card.subCaption}</small>
        </>
      );
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
  const dragRef = useRef<{ id: string; x: number; y: number } | null>(null);
  const [positions, setPositions] = useState<Record<string, Position>>(() =>
    Object.fromEntries(
      data.cards.map((card) => [card.id, { fx: card.fx, fy: card.fy, rot: card.rot }]),
    ),
  );
  const [dragged, setDragged] = useState<string | null>(null);

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
            fx: 0.02 + Math.random() * 0.8,
            fy: 0.02 + Math.random() * 0.8,
            rot: -6 + Math.random() * 12,
          },
        ]),
      ),
    );

  useEffect(() => {
    const finish = () => {
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
    if (!data.allowDrag || window.matchMedia("(max-width: 820px)").matches) return;
    const card = event.currentTarget;
    const rect = card.getBoundingClientRect();
    dragRef.current = { id, x: event.clientX - rect.left, y: event.clientY - rect.top };
    setDragged(id);
    card.setPointerCapture(event.pointerId);
  }
  function pointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    const board = boardRef.current;
    if (!drag || !board) return;
    const card = event.currentTarget;
    const boardRect = board.getBoundingClientRect();
    const x = Math.max(
      -card.offsetWidth * 0.25,
      Math.min(
        board.clientWidth - card.offsetWidth * 0.75,
        event.clientX - boardRect.left - drag.x,
      ),
    );
    const y = Math.max(
      -8,
      Math.min(
        board.clientHeight - card.offsetHeight * 0.35,
        event.clientY - boardRect.top - drag.y,
      ),
    );
    setPositions((current) => ({
      ...current,
      [drag.id]: {
        ...current[drag.id]!,
        fx: x / Math.max(1, board.clientWidth - card.offsetWidth),
        fy: y / Math.max(1, board.clientHeight - card.offsetHeight),
      },
    }));
  }

  return (
    <main className="room-page">
      <section className="room-hero">
        <div className="wrap">
          <span className="slate">Off the clock</span>
          <h1>
            The <em>Drawing Room</em>
          </h1>
          <p>{data.intro}</p>
          {data.showShuffle ? (
            <div>
              <button type="button" onClick={shuffle}>
                Shuffle the board
              </button>
              <button type="button" onClick={reset}>
                Reset
              </button>
            </div>
          ) : null}
        </div>
      </section>
      <section className="wrap">
        <div className="mood-board" ref={boardRef}>
          {data.cards.map((card) => {
            const position = positions[card.id]!;
            return (
              <div
                key={card.id}
                className={`mood-card mood-card--${card.type} ${dragged === card.id ? "is-dragging" : ""}`}
                style={{
                  left: `${position.fx * 100}%`,
                  top: `${position.fy * 100}%`,
                  rotate: `${position.rot}deg`,
                }}
                onPointerDown={(event) => pointerDown(event, card.id)}
                onPointerMove={pointerMove}
              >
                {cardContent(card)}
              </div>
            );
          })}
        </div>
      </section>
      <section className="room-close">
        <span className="slate">That&apos;s the room</span>
        <h2>Back to business?</h2>
      </section>
    </main>
  );
}
