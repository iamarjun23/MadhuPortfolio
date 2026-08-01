"use client";
import { useEffect, useRef, useState } from "react";
import type { Booth } from "@/schemas";
export function Photobooth({ data }: Readonly<{ data: Booth }>) {
  const [active, setActive] = useState<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (active !== null) closeRef.current?.focus();
  }, [active]);
  useEffect(() => {
    function keydown(event: KeyboardEvent) {
      if (active === null) return;
      if (event.key === "Escape") setActive(null);
      if (event.key === "ArrowLeft")
        setActive((value) =>
          value === null ? null : (value - 1 + data.slots.length) % data.slots.length,
        );
      if (event.key === "ArrowRight")
        setActive((value) => (value === null ? null : (value + 1) % data.slots.length));
    }
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, [active, data.slots.length]);
  const slot = active === null ? null : data.slots[active];
  return (
    <section className="section" id="photobooth">
      <div className="wrap">
        <header className="section-heading">
          <span className="slate">Photobooth</span>
          <h2>On set &amp; in the room</h2>
        </header>
        <div className="booth">
          {data.slots.map((item, index) => (
            <button
              key={item.id}
              className={`booth__item booth__item--${item.tile}`}
              type="button"
              onClick={() => setActive(index)}
            >
              <span className="booth__image">
                {item.image ? <img src={item.image.url} alt={item.image.alt} /> : "ADD PHOTO"}
              </span>
              {item.hasTape ? <span className="booth__tape" aria-hidden="true" /> : null}
              <span>
                <b>{item.title}</b>
                <small>{item.subtitle}</small>
              </span>
            </button>
          ))}
        </div>
      </div>
      {slot ? (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Photo viewer"
          onClick={() => setActive(null)}
        >
          <button ref={closeRef} type="button" onClick={() => setActive(null)}>
            Close
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setActive((value) =>
                value === null ? 0 : (value - 1 + data.slots.length) % data.slots.length,
              );
            }}
          >
            Previous
          </button>
          <div onClick={(event) => event.stopPropagation()}>
            {slot.image ? (
              <img src={slot.image.url} alt={slot.image.alt} />
            ) : (
              <span>ADD PHOTO</span>
            )}
            <p>{slot.lightboxCaption}</p>
          </div>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setActive((value) => (value === null ? 0 : (value + 1) % data.slots.length));
            }}
          >
            Next
          </button>
        </div>
      ) : null}
    </section>
  );
}
