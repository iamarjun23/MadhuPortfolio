"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { isUploadedMediaSrc, transformedVideoSrc } from "@/lib/media-src";
import { PHONE_MAX_WIDTH } from "@/lib/site-scale";
import { initialTimecode, useTimecode } from "@/lib/use-timecode";
import type { Hero as HeroData } from "@/schemas";

type HeroProps = Readonly<{ data: HeroData }>;

const PHONE = `(max-width: ${PHONE_MAX_WIDTH}px)`;

/* The still shown before a video plays. An uploaded poster wins. Otherwise an uploaded
   video supplies its own first frame, so the still always matches the clip (an external
   stock poster would not, and can go dead). */
function posterOf(video: Readonly<{ url: string; poster?: string }>, width: number) {
  const uploaded = video.poster && isUploadedMediaSrc(video.poster) ? video.poster : null;
  return {
    uploaded,
    src:
      uploaded ??
      transformedVideoSrc(video.url, `mode=frame,time=0s,width=${width}`) ??
      video.poster,
  };
}

export function Hero({ data }: HeroProps) {
  const [wordIndex, setWordIndex] = useState(0);
  /* Deleting cut words in the studio can leave the rotation past the end of the
     shortened list, which rendered the headline with a hole in it. */
  const cutWord = data.cutWords[wordIndex % Math.max(1, data.cutWords.length)] ?? "";
  const backgroundRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timecodeRef = useTimecode();
  const parallaxRef = useRef({ allowed: false, frame: 0, x: 0, y: 0 });
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  // The untransformed address of whichever video is attached, for when its re-encode fails.
  const originalSrc = useRef(data.bgVideo.url);
  const [pausedByVisitor, setPausedByVisitor] = useState(false);
  const { uploaded: uploadedPoster, src: poster } = posterOf(data.bgVideo, 1280);
  const phoneVideoUrl = data.bgVideoMobile?.url;
  const phonePoster = data.bgVideoMobile ? posterOf(data.bgVideoMobile, 720).src : null;

  /* The background video runs to tens of megabytes, and an autoplaying <video> starts
     downloading the moment it is parsed, whatever `preload` says - competing with the
     headline, fonts and images for the first paint. So the page first paints over the
     poster and the video's source is only attached once the page has finished loading
     and the browser is idle. Visitors who ask for reduced motion keep the still. */
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let cancelPending = () => {};
    /* An upload is swapped for an edge-cached re-encode: the originals run to ~20 Mbit/s, and
       R2's own responses are not cached at the edge. 1920 keeps full HD on desktop at about
       half the bytes; phones get 1280, about a fifth. A phone plays the vertical cut when
       there is one, at 720 wide. */
    const attach = () => {
      const onPhone = window.matchMedia(PHONE).matches;
      const source = onPhone && phoneVideoUrl ? phoneVideoUrl : data.bgVideo.url;
      const width = source === phoneVideoUrl ? 720 : window.screen.width > 900 ? 1920 : 1280;
      originalSrc.current = source;
      setVideoSrc(transformedVideoSrc(source, `mode=video,width=${width}`) ?? source);
    };
    // Safari has no requestIdleCallback; a short timeout after `load` is close enough there.
    const whenIdle = () => {
      if (typeof window.requestIdleCallback === "function") {
        const handle = window.requestIdleCallback(attach, { timeout: 2000 });
        cancelPending = () => window.cancelIdleCallback(handle);
      } else {
        const handle = window.setTimeout(attach, 200);
        cancelPending = () => window.clearTimeout(handle);
      }
    };

    if (document.readyState === "complete") whenIdle();
    else window.addEventListener("load", whenIdle, { once: true });
    return () => {
      window.removeEventListener("load", whenIdle);
      cancelPending();
    };
  }, [data.bgVideo.url, phoneVideoUrl]);

  // A muted play() is what autoplay policies allow; if it is still refused the poster stays.
  // Paused once scrolled past so it stops decoding under the rest of the page. Re-run when the
  // source arrives: observing fires straight away, which starts playback if the hero is in view.
  // A visitor's own pause holds until they press play again.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoSrc) return;
    if (pausedByVisitor) {
      video.pause();
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) video.play().catch(() => {});
      else video.pause();
    });
    observer.observe(video);
    return () => observer.disconnect();
  }, [videoSrc, pausedByVisitor]);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;
    const wordTimer = window.setInterval(
      () => setWordIndex((value) => (value + 1) % data.cutWords.length),
      2600,
    );
    return () => window.clearInterval(wordTimer);
  }, [data.cutWords.length]);

  // Resolved once instead of on every pointer event: matchMedia is a layout
  // read, and the parallax fired it twice per move.
  useEffect(() => {
    const parallax = parallaxRef.current;
    parallax.allowed =
      window.matchMedia("(pointer: fine)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    return () => {
      if (parallax.frame) cancelAnimationFrame(parallax.frame);
      parallax.frame = 0;
    };
  }, []);

  function handlePointerMove(event: React.PointerEvent<HTMLElement>) {
    const parallax = parallaxRef.current;
    if (!parallax.allowed) return;

    parallax.x = event.clientX;
    parallax.y = event.clientY;

    // Coalesce to one write per frame. Pointer events fire far faster than the
    // display refreshes, and each one used to force a layout and a style write.
    if (parallax.frame) return;
    const section = event.currentTarget;
    parallax.frame = requestAnimationFrame(() => {
      parallax.frame = 0;
      const bounds = section.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      const x = (parallax.x - bounds.left) / bounds.width - 0.5;
      const y = (parallax.y - bounds.top) / bounds.height - 0.5;
      backgroundRef.current?.style.setProperty(
        "transform",
        `scale(1.05) translate(${(-x * 14).toFixed(1)}px, ${(-y * 12).toFixed(1)}px)`,
      );
    });
  }

  return (
    <section
      className="hero"
      id="hero"
      aria-label="Introduction"
      onPointerMove={handlePointerMove}
      onPointerLeave={() => backgroundRef.current?.style.setProperty("transform", "scale(1.04)")}
    >
      <div className="hero__background" ref={backgroundRef} aria-hidden="true">
        <div className="hero__fallback" />
        {/* The first thing a visitor sees, so it is preloaded from <head> at high priority and
            becomes the LCP element; the video, attached after load, covers it from its first frame. */}
        {poster ? (
          /* The <source> hands a phone the vertical cut's still instead. A preload cannot be
             limited to one screen size, so with two stills the image is left to the browser's
             own scan of the markup, which still finds it first. */
          <picture>
            {phonePoster ? <source media={PHONE} srcSet={phonePoster} /> : null}
            <Image
              className="hero__poster"
              src={poster}
              alt=""
              fill
              sizes="100vw"
              preload={!phonePoster}
              fetchPriority="high"
              // Only an uploaded poster can go through the image loader; Cloudflare will not
              // resize a video frame a second time.
              unoptimized={!uploadedPoster}
            />
          </picture>
        ) : null}
        <video
          className="hero__video"
          ref={videoRef}
          muted
          loop
          playsInline
          preload="none"
          src={videoSrc ?? undefined}
          // If the re-encode fails (say, a source past Cloudflare's size limit), play the original.
          onError={() => setVideoSrc((current) => (current ? originalSrc.current : current))}
        />
        {data.bgVideo.duotone ? <div className="hero__tint" /> : null}
        <div className="hero__scrim" />
      </div>
      {/* Keyed on the cut word so each swap remounts it and replays the crop marks' snap. */}
      <div className="hero__frame" key={cutWord} aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="hero__hud">
        <span>{data.reelLabel}</span>
        <span className="hero__timecode">
          <span className="hero__record" />
          REC
          <span ref={timecodeRef}>{initialTimecode}</span>
        </span>
      </div>
      <div className="wrap hero__content">
        <span className="slate">{data.eyebrow}</span>
        <h1>
          <span>{data.line1}</span>
          <span>
            {data.line2} <em key={cutWord}>{cutWord}</em>.
          </span>
        </h1>
        <p>{data.sub}</p>
        <div className="hero__actions">
          <a className="button button--primary" href={data.primaryCta.href}>
            {data.primaryCta.label}
            <span aria-hidden="true">&rarr;</span>
          </a>
          <Link className="button button--light" href={data.secondaryCta.href}>
            {data.secondaryCta.label}
            <span aria-hidden="true">&rarr;</span>
          </Link>
          {/* Phone layout only, where the video fills the screen behind the headline. */}
          <button
            type="button"
            className="hero__pause"
            aria-label={pausedByVisitor ? "Play background video" : "Pause background video"}
            onClick={() => setPausedByVisitor((paused) => !paused)}
          >
            <svg viewBox="0 0 16 16" aria-hidden="true">
              {pausedByVisitor ? (
                <path d="M4 2l10 6-10 6z" />
              ) : (
                <path d="M4 2h3v12H4zM9 2h3v12H9z" />
              )}
            </svg>
          </button>
        </div>
      </div>
      <div className="hero__meta">
        {/* Blanked fields drop out rather than leaving an empty cell between dividers. */}
        <ul>
          {[data.footerLeftLabel, data.creditLine1, data.creditLine2, data.aspectRatioLabel]
            .filter(Boolean)
            .map((label, index) => (
              <li key={index}>{label}</li>
            ))}
        </ul>
        <span>{data.footerRightLabel}</span>
      </div>
    </section>
  );
}
