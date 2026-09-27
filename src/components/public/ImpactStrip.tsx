"use client";
import { useEffect, useRef, useState } from "react";
import { MediaImage } from "@/components/public/MediaImage";
import { realImage } from "@/lib/placeholders";
import { PHOTO_VIEWER_SIZES, preloadViewerPhoto } from "@/lib/preload-image";
import { useDialogFocus } from "@/lib/use-dialog-focus";
import type { Impact } from "@/schemas";

/* The stand-in on a collaborator tile that has no photo yet: the first letter of
   the first two words, so the grid keeps one shape whether or not a picture has
   been uploaded. */
function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

function CountUp({ value }: Readonly<{ value: string }>) {
  const match = value.match(/^(\d[\d,.]*)(.*)$/);
  const numericValue = match?.[1] ?? "";
  const target = numericValue ? parseFloat(numericValue.replace(/,/g, "")) : 0;
  const suffix = match?.[2] ?? value;
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!target) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      const frame = requestAnimationFrame(() => setN(target));
      return () => cancelAnimationFrame(frame);
    }
    const start = performance.now();
    const dur = 1400;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min((t - start) / dur, 1);
      setN(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  const decimals = numericValue.includes(".") ? 1 : 0;
  return (
    <>
      {n.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </>
  );
}

export function ImpactStrip({
  data,
  onSelectCollaborator,
  onMoveCollaborator,
}: Readonly<{
  data: Impact;
  /* Studio's admin preview: a click opens the collaborator's editor instead of
     the photo pop-up, and a card can be dragged onto another to reorder.
     Both work in indexes into `data.worked`. */
  onSelectCollaborator?: (index: number) => void;
  onMoveCollaborator?: (from: number, to: number) => void;
}>) {
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const ref = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (activeIndex === null) return;

    window.requestAnimationFrame(() => {
      gridRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveIndex(null);
    };

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [activeIndex]);
  const collaborators = data.worked;
  const activePerson = activeIndex !== null ? collaborators[activeIndex] : undefined;
  const activeImage = activePerson ? realImage(activePerson.image) : null;
  const previewRef = useRef<HTMLDivElement>(null);
  useDialogFocus(previewRef, Boolean(activePerson && activeImage));

  return (
    <section className="impact" ref={ref}>
      <div className="wrap">
        <div className="impact__panel">
          <div className="impact__stats">
            {data.stats.map((stat) => (
              <div key={stat.label}>
                <strong>{visible ? <CountUp value={stat.value} /> : "0"}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
          <div className="impact__worked">
            <div className="impact__worked-heading">
              <h2>
                <b aria-hidden="true">02</b>
                {data.heading}
              </h2>
              <span>
                {collaborators.length} {data.collaboratorsLabel}
              </span>
            </div>
            <div
              className="impact__worked-grid"
              ref={gridRef}
              data-studio-hooks={onSelectCollaborator ? "" : undefined}
            >
              {collaborators.map((person, index) => {
                const isActive = index === activeIndex;
                const image = realImage(person.image);
                const workedIndex = data.worked.indexOf(person);
                return (
                  <button
                    type="button"
                    key={person.name}
                    aria-expanded={isActive}
                    disabled={!image && !onSelectCollaborator}
                    className={
                      [
                        isActive ? "is-active" : "",
                        dragFrom === workedIndex ? "is-dragging" : "",
                        dragOver === workedIndex && dragFrom !== workedIndex
                          ? "is-drop-target"
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" ") || undefined
                    }
                    onClick={() =>
                      onSelectCollaborator
                        ? onSelectCollaborator(workedIndex)
                        : setActiveIndex(isActive ? null : index)
                    }
                    // Fires on hover, and on a touch before its click.
                    onPointerEnter={image ? () => preloadViewerPhoto(image.url) : undefined}
                    onFocus={image ? () => preloadViewerPhoto(image.url) : undefined}
                    {...(onMoveCollaborator
                      ? {
                          draggable: true,
                          onDragStart: (event: React.DragEvent) => {
                            event.dataTransfer.effectAllowed = "move";
                            // Firefox will not start a drag without data set.
                            event.dataTransfer.setData("text/plain", String(workedIndex));
                            setDragFrom(workedIndex);
                          },
                          onDragOver: (event: React.DragEvent) => {
                            event.preventDefault();
                            setDragOver(workedIndex);
                          },
                          onDrop: (event: React.DragEvent) => {
                            event.preventDefault();
                            if (dragFrom !== null && dragFrom !== workedIndex) {
                              onMoveCollaborator(dragFrom, workedIndex);
                            }
                          },
                          onDragEnd: () => {
                            setDragFrom(null);
                            setDragOver(null);
                          },
                        }
                      : {})}
                  >
                    <span className="impact__worked-thumb" aria-hidden={!image}>
                      {image ? (
                        /* Square tiles, about 8-10rem wide; two to a row under 900px.
                           Decorative here: the button already reads the name. The
                           preview dialog below carries the photo's own alt. */
                        <MediaImage
                          src={image.url}
                          alt=""
                          width={384}
                          height={384}
                          sizes="(max-width: 900px) 45vw, 160px"
                          draggable={false}
                        />
                      ) : (
                        <em>{initials(person.name)}</em>
                      )}
                    </span>
                    <span className="impact__worked-copy">
                      <span>{person.name}</span>
                      <small>{person.context}</small>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          {activePerson && activeImage ? (
            <>
              {/* Same pop-up as the Drawing Room's photo viewer (the mood-player styles). */}
              <div
                className="mood-player__scrim"
                aria-hidden="true"
                onClick={() => setActiveIndex(null)}
              />
              <div
                className="mood-player mood-player--photo"
                role="dialog"
                aria-modal="true"
                aria-label={`${activePerson.name} preview`}
                ref={previewRef}
                tabIndex={-1}
              >
                <button
                  type="button"
                  className="mood-player__close"
                  onClick={() => setActiveIndex(null)}
                  aria-label="Close"
                >
                  &times;
                </button>
                <div className="mood-player__media mood-player__media--photo">
                  {/* Nominal size only: the CSS lets the photo take its own natural shape. */}
                  <MediaImage
                    src={activeImage.url}
                    alt={activeImage.alt}
                    width={1600}
                    height={1200}
                    sizes={PHOTO_VIEWER_SIZES}
                  />
                </div>
                <div className="mood-player__copy">
                  <span className="mood-player__source">
                    <i aria-hidden="true" />
                    Photograph
                  </span>
                  <small>{data.detailLabel}</small>
                  <h3>{activePerson.name}</h3>
                  {activePerson.context ? <p>{activePerson.context}</p> : null}
                  <span className="mood-player__hint" aria-hidden="true">
                    Esc to close
                  </span>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
