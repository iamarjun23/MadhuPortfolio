"use client";

import { useEffect, useRef, useState } from "react";
import { MediaImage } from "@/components/public/MediaImage";
import { imageOrFallback, type FallbackImage } from "@/lib/placeholders";
import type { About } from "@/schemas";

export function AboutBlock({
  data,
  fallbackImage = null,
}: Readonly<{ data: About; fallbackImage?: FallbackImage }>) {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const portraitVideo = data.portraitVideo;
  const portraitImage = imageOrFallback(data.portrait, fallbackImage, "N Madhu Kumar");
  // With no portrait, no clip and no site-wide stand-in, the frame is dropped
  // and the story takes the full width rather than sitting beside an empty box.
  const hasPortrait = Boolean(portraitImage || portraitVideo);

  // Observe the section, not .portrait: the portrait's entrance clip-path
  // collapses it to zero area, which would keep intersectionRatio pinned at 0.
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
          // The portrait clip is below the fold, so its source is only fetched
          // once the section is actually reached instead of competing with the
          // hero for bandwidth on first paint.
          videoRef.current?.play().catch(() => {});
          observer.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="section" id="about" ref={sectionRef}>
      <div className={`wrap about${hasPortrait ? "" : " about--no-portrait"}`}>
        {/* The portrait photo is the subject of this section, so it fills the
            frame whenever there is one. A portrait video no longer replaces it:
            with both set the video plays as a clip inset into the corner, and it
            only fills the frame itself when there is no photo to show. */}
        {hasPortrait ? (
          <div className={`portrait${isVisible ? " portrait--in" : ""}`}>
            {portraitImage ? (
              <MediaImage
                src={portraitImage.url}
                alt={portraitImage.alt}
                fill
                sizes="(max-width: 900px) min(100vw, 420px), 40vw"
              />
            ) : portraitVideo ? (
              <video
                ref={videoRef}
                muted
                loop
                playsInline
                preload="none"
                poster={portraitVideo.poster}
                aria-label="Madhu editing"
              >
                <source src={portraitVideo.url} type="video/mp4" />
              </video>
            ) : null}
            {portraitImage && portraitVideo ? (
              <div className="portrait__clip">
                <video
                  ref={videoRef}
                  muted
                  loop
                  playsInline
                  preload="none"
                  poster={portraitVideo.poster}
                  aria-label="Madhu at the edit desk"
                >
                  <source src={portraitVideo.url} type="video/mp4" />
                </video>
              </div>
            ) : null}
          </div>
        ) : null}
        <div className="about__text">
          <span className="slate">
            <b className="slate__index">01</b>
            {data.eyebrow}
          </span>
          <h2>{data.heading}</h2>
          {data.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <div className="about__specs">
            <div>
              <span className="about__specs-label">{data.statusLabel}</span>
              <span className="current-status">
                <i />
                {data.currentStatus}
              </span>
            </div>
            <div>
              <span className="about__specs-label">{data.skillsLabel}</span>
              <div className="about__skill-groups">
                {data.skillGroups.map((group) => (
                  <div key={group.label}>
                    <b>{group.label}</b>
                    <div className="tags">
                      {group.items.map((skill) => (
                        <span className="about__skill" key={skill}>
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
