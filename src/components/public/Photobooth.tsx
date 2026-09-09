"use client";
import { useEffect, useRef, useState } from "react";
import { MediaImage } from "@/components/public/MediaImage";
import { imageOrFallback, type FallbackImage } from "@/lib/placeholders";
import type { Booth } from "@/schemas";

export function Photobooth({
  data,
  fallbackImage = null,
}: Readonly<{ data: Booth; fallbackImage?: FallbackImage }>) {
  /* The wall is photographs: a slot takes its own, or the site's stand-in, and
     with neither it is simply not on the wall. */
  const slots = data.slots.flatMap((slot) => {
    const image = imageOrFallback(slot.image, fallbackImage, slot.title);
    return image ? [{ ...slot, image }] : [];
  });
  const [active, setActive] = useState<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (active !== null) {
      closeRef.current?.focus();
      return;
    }

    openerRef.current?.focus();
    openerRef.current = null;
  }, [active]);

  useEffect(() => {
    function keydown(event: KeyboardEvent) {
      if (active === null) return;
      if (event.key === "Escape") setActive(null);
      if (event.key === "ArrowLeft")
        setActive((value) => (value === null ? null : (value - 1 + slots.length) % slots.length));
      if (event.key === "ArrowRight")
        setActive((value) => (value === null ? null : (value + 1) % slots.length));
    }
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, [active, slots.length]);

  function openLightbox(index: number, opener: HTMLButtonElement) {
    openerRef.current = opener;
    setActive(index);
  }

  function closeLightbox() {
    setActive(null);
  }

  function trapFocus(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab") return;

    const focusable =
      dialogRef.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)");
    if (!focusable?.length) return;

    const first = focusable.item(0);
    const last = focusable.item(focusable.length - 1);
    if (!first || !last) return;

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  const slot = active === null ? null : slots[active];

  if (slots.length === 0) return null;

  return (
    <section className="section" id="photobooth">
      <div className="wrap">
        <header className="section-heading">
          <span className="slate">{data.eyebrow}</span>
          <h2>{data.heading}</h2>
        </header>
        <div className="booth">
          {slots.map((item, index) => (
            <button
              key={item.id}
              className={`booth__item booth__item--${item.tile}`}
              type="button"
              onClick={(event) => openLightbox(index, event.currentTarget)}
            >
              <span className="booth__image">
                <MediaImage
                  src={item.image.url}
                  alt={item.image.alt}
                  fill
                  sizes="(max-width: 720px) 100vw, (max-width: 1100px) 50vw, 33vw"
                />
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
          ref={dialogRef}
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Photo viewer"
          onClick={closeLightbox}
          onKeyDown={trapFocus}
        >
          <button ref={closeRef} type="button" onClick={closeLightbox}>
            {data.lightboxCloseLabel}
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setActive((value) =>
                value === null ? 0 : (value - 1 + slots.length) % slots.length,
              );
            }}
          >
            {data.lightboxPreviousLabel}
          </button>
          <div onClick={(event) => event.stopPropagation()}>
            <MediaImage
              src={slot.image.url}
              alt={slot.image.alt}
              width={1200}
              height={800}
              sizes="(max-width: 720px) 92vw, 80vw"
            />
            <p>{slot.lightboxCaption}</p>
          </div>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setActive((value) => (value === null ? 0 : (value + 1) % slots.length));
            }}
          >
            {data.lightboxNextLabel}
          </button>
        </div>
      ) : null}
    </section>
  );
}
