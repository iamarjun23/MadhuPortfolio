"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { MediaImage } from "@/components/public/MediaImage";
import { SectionTimeline } from "@/components/public/SectionTimeline";
import type { TimelinePosition } from "@/lib/section-timeline";
import { imageOrFallback, type FallbackImage } from "@/lib/placeholders";
import type { Experience as ExperienceData } from "@/schemas";

const SCENE_MS = 7000;
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeToMotion(onChange: () => void) {
  const query = matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/* Visitors who asked for less motion (in the OS, or via the site's own switch)
   start with the reel paused; the play button still lets them run it. */
function prefersStillReel() {
  return matchMedia(REDUCED_MOTION).matches || document.querySelector(".motion-disabled") !== null;
}

function sceneNumber(index: number) {
  return String(index + 1).padStart(2, "0");
}

export function Experience({
  data,
  fallbackImage = null,
  autoPlay = true,
  timeline,
  editable = false,
}: Readonly<{
  data: ExperienceData;
  fallbackImage?: FallbackImage;
  autoPlay?: boolean;
  timeline?: TimelinePosition;
  /** Studio preview only: the reel's controls keep working, and a thumb opens its role. */
  editable?: boolean;
}>) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [pausedByVisitor, setPausedByVisitor] = useState<boolean | null>(null);
  const stillByDefault = useSyncExternalStore(subscribeToMotion, prefersStillReel, () => false);
  const trackRef = useRef<HTMLOListElement>(null);
  const roles = data.roles;
  /* Deleting roles in the studio can leave the selection past the end of the
     list. Clamping keeps the reel on its last scene instead of blanking the
     whole section out from under the editor. */
  const activeIndex = roles.length === 0 ? 0 : Math.min(selectedIndex, roles.length - 1);
  const activeRole = roles[activeIndex];
  const canPlay = autoPlay && roles.length > 1;
  const playing = canPlay && !(pausedByVisitor ?? stillByDefault);
  const remainingMsRef = useRef(SCENE_MS);

  // A new scene starts with its full running time. Declared before the timer
  // so it runs first when the scene changes.
  useEffect(() => {
    remainingMsRef.current = SCENE_MS;
  }, [activeIndex]);

  /* Pausing keeps whatever is left of the scene, so the timeline's playhead
     (a CSS animation that pauses in place) and the cut stay in step. */
  useEffect(() => {
    if (!playing) return;
    const startedAt = performance.now();
    const timer = setTimeout(
      () => setSelectedIndex((activeIndex + 1) % roles.length),
      remainingMsRef.current,
    );
    return () => {
      clearTimeout(timer);
      remainingMsRef.current -= performance.now() - startedAt;
    };
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
        <SectionTimeline label={data.eyebrow} position={timeline} />
        <header className="section-heading">
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
        >
          <article className="experience-reel__frame" aria-live={playing ? "off" : "polite"}>
            <div className="experience-reel__slate">
              <span className="experience-reel__rec">
                {data.sceneLabel} {sceneNumber(activeIndex)}
              </span>
              <span className="sr-only">: {activeRole.company}</span>
            </div>
            <div className="experience-reel__screen">
              {sceneImage ? (
                <div
                  key={`img-${activeRole.id}`}
                  className="experience-reel__image"
                  style={focal(activeRole)}
                  aria-hidden="true"
                >
                  <MediaImage
                    src={sceneImage.url}
                    alt=""
                    fill
                    sizes="(max-width: 1100px) 100vw, 64vw"
                  />
                </div>
              ) : null}
            </div>
            <div className="experience-reel__inspector">
              {/* Every scene's notes share one grid cell, so a stacked panel is as
                  tall as the longest one and the page never jumps as the reel plays. */}
              <div className="experience-reel__notes">
                {roles.map((role, index) => (
                  <div
                    key={role.id}
                    className={`experience-reel__info${index === activeIndex ? " is-active" : ""}`}
                  >
                    <div className="experience-reel__title-row">
                      <h3>{role.company}</h3>
                      <span className={`experience__logo ${role.logoHint}`}>{role.initials}</span>
                    </div>
                    <p className="experience-reel__role-title">{role.role}</p>
                    <p className="experience-reel__dates">
                      {role.start} — {role.end}
                    </p>
                    <p className="experience-reel__description">{role.description}</p>
                  </div>
                ))}
              </div>
              <div
                className="experience-reel__controls"
                data-studio-hooks={editable ? "" : undefined}
              >
                {canPlay ? (
                  <button
                    type="button"
                    className="experience-reel__button"
                    onClick={() => setPausedByVisitor(playing)}
                    aria-label={playing ? data.pauseLabel : data.playLabel}
                  >
                    <svg viewBox="0 0 16 16" aria-hidden="true">
                      {playing ? (
                        <path d="M4 2h3v12H4zM9 2h3v12H9z" />
                      ) : (
                        <path d="M4 2l10 6-10 6z" />
                      )}
                    </svg>
                  </button>
                ) : null}
                <button
                  type="button"
                  className="experience-reel__button"
                  onClick={() => moveChapter(-1)}
                  aria-label={data.previousLabel}
                >
                  <svg viewBox="0 0 16 16" aria-hidden="true">
                    <path d="M2 2h2v12H2zM14 2v12L5 8z" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="experience-reel__button"
                  onClick={() => moveChapter(1)}
                  aria-label={data.nextLabel}
                >
                  <svg viewBox="0 0 16 16" aria-hidden="true">
                    <path d="M12 2h2v12h-2zM2 2v12l9-6z" />
                  </svg>
                </button>
                <span className="experience-reel__duration">{activeRole.duration}</span>
                <span className="experience-reel__count">
                  {activeIndex + 1} / {roles.length}
                </span>
              </div>
            </div>
          </article>
          {/* The filmstrip doubles as the reel's timeline: played scenes stay lit and
              an orange playhead runs across the scene on screen. */}
          <ol ref={trackRef} className="experience-reel__track" aria-label="Career scenes">
            {roles.map((role, index) => {
              const thumb = imageOrFallback(role.image, fallbackImage, "");
              return (
                <li key={role.id} data-studio-path={editable ? `roles.${index}` : undefined}>
                  <button
                    type="button"
                    className={
                      index === activeIndex
                        ? "is-active"
                        : index < activeIndex
                          ? "is-played"
                          : undefined
                    }
                    aria-current={activeIndex === index ? "step" : undefined}
                    onClick={() => setSelectedIndex(index)}
                  >
                    <i className="experience-reel__thumb" style={focal(role)} aria-hidden="true">
                      {thumb ? (
                        <MediaImage
                          src={thumb.url}
                          alt=""
                          fill
                          sizes="(max-width: 560px) 50vw, 20vw"
                        />
                      ) : null}
                    </i>
                    <span>{sceneNumber(index)}</span>
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
