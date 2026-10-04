"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { MediaImage } from "@/components/public/MediaImage";
import type { ReelKind } from "@/lib/reel";
import { useDialogFocus } from "@/lib/use-dialog-focus";

/** What the viewer is showing: a reel of some kind, or a still photo. */
export type ViewerKind = ReelKind | "photo";

/** The text and still of one item in the viewer; the media itself is passed as children. */
export type ViewerItem = Readonly<{
  kind: ViewerKind;
  title: string;
  subtitle?: string | null;
  /** Still for the "Up next" card, or null to show the kind's icon instead. */
  thumbnail: string | null;
  cta?: Readonly<{ href: string; label: string }> | null;
}>;

type MediaViewerProps = Readonly<{
  item: ViewerItem;
  /** The item after this one, or null when there is nothing to step to. */
  next: ViewerItem | null;
  index: number;
  total: number;
  onStep: (direction: 1 | -1) => void;
  onClose: () => void;
  children: ReactNode;
}>;

const KIND_LABEL: Record<ViewerKind, string> = {
  photo: "Photo",
  youtube: "YouTube",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  upload: "Video",
  other: "Link",
  none: "Video",
};

/* A card may be saved without a caption; its type stands in so nothing reads blank. */
const titleOf = (item: ViewerItem) => item.title.trim() || KIND_LABEL[item.kind];

function KindIcon({ kind }: Readonly<{ kind: ViewerKind }>) {
  const common = {
    width: 14,
    height: 14,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (kind) {
    case "photo":
      return (
        <svg {...common}>
          <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
          <circle cx="12" cy="13" r="3.5" />
        </svg>
      );
    case "instagram":
      return (
        <svg {...common}>
          <rect x="4" y="4" width="16" height="16" rx="5" />
          <circle cx="12" cy="12" r="3.5" />
          <circle cx="17" cy="7" r="0.6" fill="currentColor" />
        </svg>
      );
    case "linkedin":
      return (
        <svg {...common}>
          <rect x="4" y="4" width="16" height="16" rx="3" />
          <path d="M8 11v5M8 8v.01M12 16v-5M12 13a2 2 0 0 1 4 0v3" />
        </svg>
      );
    case "other":
      return (
        <svg {...common}>
          <path d="M10 14a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1 1M14 10a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6l1-1" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="4" />
          <path d="M10 9.5v5l4.5-2.5z" fill="currentColor" />
        </svg>
      );
  }
}

/** The site's one media pop-up: the media on the left, a slim panel on the right with
    its type, title, outbound link and the next item. The Drawing Room, the
    impact photos and the work board all open through here. Escape and the scroll lock
    stay with the caller; the viewer adds focus trapping and arrow-key stepping. */
export function MediaViewer({
  item,
  next,
  index,
  total,
  onStep,
  onClose,
  children,
}: MediaViewerProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocus(dialogRef, true);
  const canStep = total > 1;

  useEffect(() => {
    if (!canStep) return;
    const stepOnArrow = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") onStep(1);
      if (event.key === "ArrowLeft") onStep(-1);
    };
    window.addEventListener("keydown", stepOnArrow);
    return () => window.removeEventListener("keydown", stepOnArrow);
  }, [canStep, onStep]);

  /* Portalled to <body>: inside a section, the scroll-entrance transforms and
     animations on the landing page pinned the fixed pop-up to the section (or
     faded its media) instead of the screen. */
  return createPortal(
    <>
      <div className="mood-player__scrim" aria-hidden="true" onClick={onClose} />
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={`mood-player mood-player--${item.kind}`}
        role="dialog"
        aria-modal="true"
        aria-label={`${titleOf(item)} preview`}
      >
        <div className="mood-player__stage">
          <div className={`mood-player__media mood-player__media--${item.kind}`}>{children}</div>
          {canStep ? (
            <>
              <button
                type="button"
                className="mood-player__step mood-player__step--prev"
                onClick={() => onStep(-1)}
                aria-label="Previous item"
              >
                &#8249;
              </button>
              <button
                type="button"
                className="mood-player__step mood-player__step--next"
                onClick={() => onStep(1)}
                aria-label="Next item"
              >
                &#8250;
              </button>
            </>
          ) : null}
        </div>
        <div className="mood-player__panel">
          <div className="mood-player__tags">
            <span className="mood-player__kind">
              <KindIcon kind={item.kind} />
              {KIND_LABEL[item.kind]}
            </span>
            <button
              className="mood-player__close"
              type="button"
              onClick={onClose}
              aria-label="Close preview"
            >
              &times;
            </button>
          </div>
          <h3>{titleOf(item)}</h3>
          {item.subtitle ? <p>{item.subtitle}</p> : null}
          {item.cta ? (
            <a className="mood-player__cta" href={item.cta.href} target="_blank" rel="noreferrer">
              {item.cta.label} <span aria-hidden="true">&#8599;</span>
            </a>
          ) : null}
          {canStep && next ? (
            <div className="mood-player__foot">
              <span className="mood-player__count" aria-live="polite">
                {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
              </span>
              <button type="button" className="mood-player__next" onClick={() => onStep(1)}>
                <span className="mood-player__next-thumb">
                  {next.thumbnail ? (
                    <MediaImage src={next.thumbnail} alt="" width={128} height={88} sizes="64px" />
                  ) : (
                    <KindIcon kind={next.kind} />
                  )}
                </span>
                <span className="mood-player__next-copy">
                  <small>Up next</small>
                  <b>{titleOf(next)}</b>
                  <small>{KIND_LABEL[next.kind]}</small>
                </span>
                <span aria-hidden="true">&rarr;</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </>,
    document.body,
  );
}
