"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { initialTimecode, useTimecode } from "@/lib/use-timecode";
import type { Hero as HeroData } from "@/schemas";

type HeroProps = Readonly<{ data: HeroData }>;

export function Hero({ data }: HeroProps) {
  const [wordIndex, setWordIndex] = useState(0);
  const backgroundRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timecodeRef = useTimecode();
  const parallaxRef = useRef({ allowed: false, frame: 0, x: 0, y: 0 });

  // The autoPlay attribute alone is unreliable under browser autoplay policies;
  // a muted play() call is permitted. Falls back to the poster if it still refuses.
  useEffect(() => {
    videoRef.current?.play().catch(() => {});
  }, []);

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
        <video
          className="hero__video"
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster={data.bgVideo.poster}
        >
          <source src={data.bgVideo.url} type="video/mp4" />
        </video>
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
            {data.line2} <em key={data.cutWords[wordIndex]}>{data.cutWords[wordIndex]}</em>.
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
