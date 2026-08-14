"use client";

import { useState } from "react";
import { PlaceholderImage } from "@/components/public/PlaceholderImage";
import type { Experience as ExperienceData } from "@/schemas";

export function Experience({ data }: Readonly<{ data: ExperienceData }>) {
  const [activeIndex, setActiveIndex] = useState(0);
  const roles = data.roles;
  const activeRole = roles[activeIndex];

  if (!activeRole) return null;

  function moveChapter(direction: -1 | 1) {
    setActiveIndex((current) => (current + direction + roles.length) % roles.length);
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
                {activeRole.logo ? (
                  <PlaceholderImage
                    src={activeRole.logo.url}
                    alt=""
                    width={84}
                    height={84}
                    sizes="84px"
                  />
                ) : (
                  activeRole.initials
                )}
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
                  onClick={() => setActiveIndex(index)}
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
