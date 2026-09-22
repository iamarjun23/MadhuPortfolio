"use client";

import { useEffect, useRef, useState } from "react";
import { MediaImage } from "@/components/public/MediaImage";
import { imageOrFallback, type FallbackImage } from "@/lib/placeholders";
import type { Experience as ExperienceData } from "@/schemas";

/* Past this many scenes the reel plays itself, like an album on autoplay. */
const AUTOPLAY_AFTER = 5;
const SCENE_MS = 5000;

export function Experience({
  data,
  fallbackImage = null,
  autoPlay = true,
}: Readonly<{ data: ExperienceData; fallbackImage?: FallbackImage; autoPlay?: boolean }>) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const trackRef = useRef<HTMLOListElement>(null);
  const roles = data.roles;
  /* Deleting roles in the studio can leave the selection past the end of the
     list. Clamping keeps the reel on its last scene instead of blanking the
     whole section out from under the editor. */
  const activeIndex = roles.length === 0 ? 0 : Math.min(selectedIndex, roles.length - 1);
  const activeRole = roles[activeIndex];
  const playing = autoPlay && roles.length > AUTOPLAY_AFTER && !paused;

  useEffect(() => {
    if (!playing || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setTimeout(() => setSelectedIndex((activeIndex + 1) % roles.length), SCENE_MS);
    return () => clearTimeout(timer);
  }, [playing, activeIndex, roles.length]);

  // Keep the active thumbnail centred in the filmstrip without scrolling the page.
  useEffect(() => {
    const track = trackRef.current;
    const thumb = track?.children[activeIndex] as HTMLElement | undefined;
    if (!track || !thumb) return;
    track.scrollTo({
      left: thumb.offsetLeft - (track.clientWidth - thumb.clientWidth) / 2,
      behavior: "smooth",
    });
  }, [activeIndex]);

  if (!activeRole) return null;

  const sceneImage = imageOrFallback(activeRole.image, fallbackImage, "");
  const focal = (role: (typeof roles)[number]) =>
    ({
      "--focal-x": `${role.focalX * 100}%`,
      "--focal-y": `${role.focalY * 100}%`,
    }) as React.CSSProperties;

  function moveChapter(direction: -1 | 1) {
    setSelectedIndex((activeIndex + direction + roles.length) % roles.length);
  }

  return (
    <section className="section" id="experience">
      <div className="wrap">
        <header className="section-heading">
          <span className="slate">{data.eyebrow}</span>
          <h2>{data.heading}</h2>
        </header>
        <div className="experience__intro">
          <p>{data.intro}</p>
          <span>
            {data.reelLabel} · {roles.length} {data.scenesLabel}
          </span>
        </div>
        <div
          className={`experience-reel${playing ? " is-playing" : ""}`}
          style={{ "--scene-ms": `${SCENE_MS}ms` } as React.CSSProperties}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={(event) => setPaused(event.target.matches(":focus-visible"))}
          onBlur={() => setPaused(false)}
        >
          <article className="experience-reel__frame" aria-live="polite">
            {sceneImage ? (
              <div key={`img-${activeRole.id}`} className="experience-reel__image" style={focal(activeRole)} aria-hidden="true">
                <MediaImage
                  src={sceneImage.url}
                  alt=""
                  fill
                  sizes="(max-width: 720px) 100vw, 1200px"
                />
              </div>
            ) : null}
            <div className="experience-reel__meta">
              <span>
                {data.sceneLabel} {String(activeIndex + 1).padStart(2, "0")}
              </span>
              <span>
                {activeRole.start} — {activeRole.end}
              </span>
            </div>
            <span className="experience-reel__scene-number" aria-hidden="true">
              {String(activeIndex + 1).padStart(2, "0")}
            </span>
            <div className="experience-reel__role">
              <span className={`experience__logo ${activeRole.logoHint}`}>
                {activeRole.initials}
              </span>
              <p>{activeRole.location ?? data.defaultLocation}</p>
            </div>
            <h3 key={`title-${activeRole.id}`}>
              {activeRole.company}
            </h3>
            <p className="experience-reel__role-title">{activeRole.role}</p>
            <p className="experience-reel__description">{activeRole.description}</p>
            <footer className="experience-reel__footer">
              <strong>{activeRole.duration}</strong>
              <div>
                <button
                  type="button"
                  onClick={() => moveChapter(-1)}
                  aria-label={data.previousLabel}
                >
                  ←
                </button>
                <span>
                  {activeIndex + 1} / {roles.length}
                </span>
                <button type="button" onClick={() => moveChapter(1)} aria-label={data.nextLabel}>
                  →
                </button>
              </div>
            </footer>
          </article>
          <ol ref={trackRef} className="experience-reel__track" aria-label="Career scenes">
            {roles.map((role, index) => {
              const thumb = imageOrFallback(role.image, fallbackImage, "");
              return (
              <li key={role.id}>
                <button
                  type="button"
                  className={activeIndex === index ? "is-active" : undefined}
                  aria-current={activeIndex === index ? "step" : undefined}
                  onClick={() => setSelectedIndex(index)}
                >
                  <i className="experience-reel__thumb" style={focal(role)} aria-hidden="true">
                    {thumb ? <MediaImage src={thumb.url} alt="" fill sizes="240px" /> : null}
                  </i>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <b>{role.company}</b>
                  <small>{role.start}</small>
                </button>
              </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
