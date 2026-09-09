"use client";

import { useState } from "react";
import { MediaImage } from "@/components/public/MediaImage";
import { imageOrFallback, type FallbackImage } from "@/lib/placeholders";
import type { Experience as ExperienceData } from "@/schemas";

export function Experience({
  data,
  fallbackImage = null,
}: Readonly<{ data: ExperienceData; fallbackImage?: FallbackImage }>) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const roles = data.roles;
  /* Deleting roles in the studio can leave the selection past the end of the
     list. Clamping keeps the reel on its last scene instead of blanking the
     whole section out from under the editor. */
  const activeIndex = roles.length === 0 ? 0 : Math.min(selectedIndex, roles.length - 1);
  const activeRole = roles[activeIndex];

  if (!activeRole) return null;

  const sceneImage = imageOrFallback(activeRole.image, fallbackImage, "");

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
        <div className="experience-reel">
          <article className="experience-reel__frame" aria-live="polite">
            {sceneImage ? (
              <div className="experience-reel__image" aria-hidden="true">
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
            <h3>
              {activeRole.company}
              <span>{activeRole.role}</span>
            </h3>
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
          <ol className="experience-reel__track" aria-label="Career scenes">
            {roles.map((role, index) => (
              <li key={role.id}>
                <button
                  type="button"
                  className={activeIndex === index ? "is-active" : undefined}
                  aria-current={activeIndex === index ? "step" : undefined}
                  onClick={() => setSelectedIndex(index)}
                >
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <b>{role.company}</b>
                  <small>{role.start}</small>
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
