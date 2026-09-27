"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { isUploadedMediaSrc, transformedVideoSrc } from "@/lib/media-src";
import { initialTimecode, useTimecode } from "@/lib/use-timecode";
import type { Hero as HeroData } from "@/schemas";

type HeroProps = Readonly<{ data: HeroData }>;

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
  /* An uploaded poster wins. Otherwise an uploaded video supplies its own first frame, so the
     still always matches the clip (an external stock poster would not, and can go dead). */
  const uploadedPoster =
    data.bgVideo.poster && isUploadedMediaSrc(data.bgVideo.poster) ? data.bgVideo.poster : null;
  const poster =
    uploadedPoster ??
    transformedVideoSrc(data.bgVideo.url, "mode=frame,time=0s,width=1280") ??
    data.bgVideo.poster;

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
       half the bytes; phones get 1280, about a fifth. `screen` rather than `innerWidth`, since
       the public layout pins phones to a 1280px viewport. */
    const attach = () =>
      setVideoSrc(
        transformedVideoSrc(
          data.bgVideo.url,
          `mode=video,width=${window.screen.width > 900 ? 1920 : 1280}`,
        ) ?? data.bgVideo.url,
      );
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
  }, [data.bgVideo.url]);

  // A muted play() is what autoplay policies allow; if it is still refused the poster stays.
  // Paused once scrolled past so it stops decoding under the rest of the page. Re-run when the
  // source arrives: observing fires straight away, which starts playback if the hero is in view.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoSrc) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) video.play().catch(() => {});
      else video.pause();
    });
    observer.observe(video);
    return () => observer.disconnect();
  }, [videoSrc]);

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
          <Image
            className="hero__poster"
            src={poster}
            alt=""
            fill
            sizes="100vw"
            preload
            fetchPriority="high"
            // Only an uploaded poster can go through the image loader; Cloudflare will not
            // resize a video frame a second time.
            unoptimized={!uploadedPoster}
          />
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
          onError={() => setVideoSrc((current) => (current ? data.bgVideo.url : current))}
        />
        {data.bgVideo.duotone ? <div className="hero__tint" /> : null}
        <div className="hero__scrim" />
      </div>
      <div className="hero__letterbox hero__letterbox--top">
        <span>{data.reelLabel}</span>
        <span>{data.aspectRatioLabel}</span>
      </div>
      <div className="hero__timecode">
        <span className="hero__record" />
        <span ref={timecodeRef}>{initialTimecode}</span>
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
        </div>
      </div>
      <div className="hero__credit">
        {data.creditLine1}
        <br />
        {data.creditLine2}
      </div>
      <div className="hero__letterbox hero__letterbox--bottom">
        <span>{data.footerLeftLabel}</span>
        <span>{data.footerRightLabel}</span>
      </div>
    </section>
  );
}
