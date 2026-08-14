"use client";

import { useEffect, useRef, useState } from "react";
import { PlaceholderImage } from "@/components/public/PlaceholderImage";
import { displayImageSrc, isPlaceholderImageSrc } from "@/lib/placeholders";
import type { About } from "@/schemas";

const STAND_IN_VIDEO_URL =
  "https://videos.pexels.com/video-files/3195650/3195650-hd_1920_1080_25fps.mp4";
const STAND_IN_VIDEO_POSTER =
  "https://images.pexels.com/videos/3195650/pexels-photo-3195650.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750";

export function AboutBlock({ data }: Readonly<{ data: About }>) {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const portraitVideo = data.portraitVideo;
  const portraitImage =
    data.portrait && !isPlaceholderImageSrc(displayImageSrc(data.portrait.url))
      ? data.portrait
      : null;

  // Observe the section, not .portrait: the portrait's entrance clip-path
  // collapses it to zero area, which would keep intersectionRatio pinned at 0.
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
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
      <div className="wrap about">
        <div className={`portrait${isVisible ? " portrait--in" : ""}`}>
          {portraitImage && !portraitVideo ? (
            <PlaceholderImage
              src={portraitImage.url}
              alt={portraitImage.alt}
              fill
              sizes="(max-width: 720px) 100vw, 48vw"
            />
          ) : (
            <video
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              poster={portraitVideo?.poster ?? portraitImage?.url ?? STAND_IN_VIDEO_POSTER}
              aria-label={portraitImage?.alt ?? "Madhu editing"}
            >
              <source src={portraitVideo?.url ?? STAND_IN_VIDEO_URL} type="video/mp4" />
            </video>
          )}
        </div>
        <div>
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
              <div className="tags">
                {data.skills.map((skill) => (
                  <span key={skill}>{skill}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
