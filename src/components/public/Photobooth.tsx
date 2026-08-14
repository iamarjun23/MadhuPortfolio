"use client";
import { useEffect, useRef, useState } from "react";
import { PlaceholderImage } from "@/components/public/PlaceholderImage";
import { placeholderImageUrl } from "@/lib/placeholders";
import type { Booth } from "@/schemas";

export function Photobooth({ data }: Readonly<{ data: Booth }>) {
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
        setActive((value) =>
          value === null ? null : (value - 1 + data.slots.length) % data.slots.length,
        );
      if (event.key === "ArrowRight")
        setActive((value) => (value === null ? null : (value + 1) % data.slots.length));
    }
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, [active, data.slots.length]);

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

  const slot = active === null ? null : data.slots[active];
  return (
    <section className="section" id="photobooth">
      <div className="wrap">
        <header className="section-heading">
          <span className="slate">{data.eyebrow}</span>
          <h2>{data.heading}</h2>
        </header>
        <div className="booth">
          {data.slots.map((item, index) => {
            const image = item.image ?? {
              url: placeholderImageUrl(item.title),
              alt: `Placeholder photo for ${item.title}`,
            };

            return (
              <button
                key={item.id}
                className={`booth__item booth__item--${item.tile}`}
                type="button"
                onClick={(event) => openLightbox(index, event.currentTarget)}
              >
                <span className="booth__image">
                  <PlaceholderImage
                    src={image.url}
                    alt={image.alt}
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
            );
          })}
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
                value === null ? 0 : (value - 1 + data.slots.length) % data.slots.length,
              );
            }}
          >
            {data.lightboxPreviousLabel}
          </button>
          <div onClick={(event) => event.stopPropagation()}>
            <PlaceholderImage
              src={(slot.image ?? { url: placeholderImageUrl(slot.title) }).url}
              alt={slot.image?.alt ?? `Placeholder photo for ${slot.title}`}
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
              setActive((value) => (value === null ? 0 : (value + 1) % data.slots.length));
            }}
          >
            {data.lightboxNextLabel}
          </button>
        </div>
      ) : null}
    </section>
  );
}
