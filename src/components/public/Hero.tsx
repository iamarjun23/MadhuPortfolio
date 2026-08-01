"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Hero as HeroData } from "@/schemas";

type HeroProps = Readonly<{ data: HeroData }>;

export function Hero({ data }: HeroProps) {
  const [wordIndex, setWordIndex] = useState(0);
  const [timecode, setTimecode] = useState("00:00:00:00");
  const backgroundRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;
    const wordTimer = window.setInterval(
      () => setWordIndex((value) => (value + 1) % data.cutWords.length),
      2600,
    );
    const timeTimer = window.setInterval(() => {
      const seconds = Math.floor(performance.now() / 1000);
      const frame = Math.floor((performance.now() % 1000) / (1000 / 24));
      setTimecode(
        `${String(Math.floor(seconds / 3600)).padStart(2, "0")}:${String(Math.floor(seconds / 60) % 60).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}:${String(frame).padStart(2, "0")}`,
      );
    }, 1000 / 24);
    return () => {
      window.clearInterval(wordTimer);
      window.clearInterval(timeTimer);
    };
  }, [data.cutWords.length]);

  function handlePointerMove(event: React.PointerEvent<HTMLElement>) {
    if (
      !window.matchMedia("(pointer: fine)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = event.clientX / bounds.width - bounds.left / bounds.width - 0.5;
    const y = event.clientY / bounds.height - bounds.top / bounds.height - 0.5;
    backgroundRef.current?.style.setProperty(
      "transform",
      `scale(1.05) translate(${(-x * 14).toFixed(1)}px, ${(-y * 12).toFixed(1)}px)`,
    );
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
        <span>REEL 01 - N MADHU KUMAR</span>
        <span>2.39 : 1</span>
      </div>
      <div className="hero__timecode">
        <span className="hero__record" />
        {timecode}
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
        CUT BY N. MADHU KUMAR
        <br />
        BENGALURU - 23.976 FPS
      </div>
      <div className="hero__letterbox hero__letterbox--bottom">
        <span>EST. 2023</span>
        <span>FRAME BY FRAME</span>
      </div>
    </section>
  );
}
