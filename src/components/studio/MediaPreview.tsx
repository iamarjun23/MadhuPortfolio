"use client";

/* Uploaded media and pasted thumbnails are addresses the editor is typing, so
   they cannot go through next/image. */
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useRef, useState } from "react";

/* The studio's photo and video cards behave like the cards on the public work
   board: the preview grows under the pointer, and clicking it opens the thing
   full size - a photo in a viewer, an upload in a player, a pasted YouTube or
   LinkedIn link in the same embed the site's own pop-up uses. */

export type PreviewSource =
  | Readonly<{ kind: "image"; src: string; alt: string }>
  | Readonly<{ kind: "video"; src: string; poster?: string }>
  | Readonly<{
      kind: "embed";
      thumbnail: string | null;
      embed: string | null;
      href: string;
      alt: string;
    }>;

type MediaPreviewProps = Readonly<{
  source: PreviewSource;
  label: string;
  onError?: () => void;
}>;

function Lightbox({
  source,
  label,
  onClose,
}: Readonly<{ source: PreviewSource; label: string; onClose: () => void }>) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose]);

  return (
    <>
      <div className="studio-lightbox__scrim" aria-hidden="true" onClick={onClose} />
      <div
        className={`studio-lightbox studio-lightbox--${source.kind}`}
        role="dialog"
        aria-modal="true"
        aria-label={`${label} at full size`}
      >
        <button
          className="studio-lightbox__close"
          type="button"
          ref={closeRef}
          onClick={onClose}
          aria-label="Close preview"
        >
          &times;
        </button>
        <div className="studio-lightbox__media">
          {source.kind === "image" ? (
            <img src={source.src} alt={source.alt || label} />
          ) : source.kind === "video" ? (
            <video src={source.src} poster={source.poster} controls autoPlay playsInline />
          ) : source.embed ? (
            <iframe
              src={source.embed}
              title={label}
              allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          ) : (
            <div className="studio-lightbox__unavailable">
              <span>This link has no preview that can play here.</span>
              <a href={source.href} target="_blank" rel="noreferrer">
                Open it in a new tab <span aria-hidden="true">&#8599;</span>
              </a>
            </div>
          )}
        </div>
        <p className="studio-lightbox__caption">{label}</p>
      </div>
    </>
  );
}

export function MediaPreview({ source, label, onError }: MediaPreviewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const close = useCallback(() => setIsOpen(false), []);

  /* An upload previews itself: it plays muted while the pointer is on the card
     and rewinds when the pointer leaves, so the card reads as a moving still. */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isHovered) {
      void video.play().catch(() => undefined);
      return;
    }
    video.pause();
    video.currentTime = 0;
  }, [isHovered]);

  const thumbnail = source.kind === "embed" ? source.thumbnail : null;
  const canOpen = source.kind !== "embed" || Boolean(source.embed) || Boolean(source.href);

  return (
    <>
      <button
        className={`studio-media-preview studio-media-preview--${source.kind}`}
        type="button"
        disabled={!canOpen}
        aria-label={`Open ${label} full size`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsHovered(true)}
        onBlur={() => setIsHovered(false)}
        onClick={() => setIsOpen(true)}
      >
        <span className="studio-media-preview__frame">
          {source.kind === "image" ? (
            <img src={source.src} alt={source.alt || label} onError={onError} />
          ) : source.kind === "video" ? (
            <video
              ref={videoRef}
              src={source.src}
              poster={source.poster}
              muted
              loop
              playsInline
              preload="metadata"
              onError={onError}
            />
          ) : thumbnail ? (
            <img src={thumbnail} alt={source.alt || label} onError={onError} />
          ) : (
            <span className="studio-media-preview__empty">No thumbnail for this link</span>
          )}
          <span className="studio-media-preview__scrim" aria-hidden="true" />
          <span className="studio-media-preview__cue" aria-hidden="true">
            {source.kind === "image" ? "⤢" : "▶"}
          </span>
        </span>
      </button>
      {isOpen ? <Lightbox source={source} label={label} onClose={close} /> : null}
    </>
  );
}
