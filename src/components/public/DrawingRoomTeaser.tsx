import Link from "next/link";
import { MediaImage } from "@/components/public/MediaImage";
import { SectionTimeline } from "@/components/public/SectionTimeline";
import type { TimelinePosition } from "@/lib/section-timeline";
import type { Room } from "@/schemas";

export function DrawingRoomTeaser({
  data,
  timeline,
}: Readonly<{ data: Room; timeline?: TimelinePosition }>) {
  const teaser = data.teaser;

  return (
    <section className="section" id="drawing-room">
      <div className="wrap">
        <SectionTimeline label={data.teaser.eyebrow} position={timeline} />
        <div className="drawing-teaser">
          {teaser.image && (
            <MediaImage
              className="drawing-teaser__backdrop"
              src={teaser.image.url}
              alt=""
              fill
              sizes="30vw"
            />
          )}
          <div className="drawing-teaser__copy">
            <p className="drawing-teaser__kicker">{teaser.stamp}</p>
            <h2>
              {teaser.heading} <em>{teaser.headingAccent}</em>
            </h2>
            <p>{teaser.description}</p>
            <Link className="drawing-teaser__link" href="/room">
              {teaser.ctaLabel} <span aria-hidden="true">↗</span>
            </Link>
          </div>
          <Link className="drawing-teaser__archive" href="/room" aria-label="Open the Drawing Room">
            <span className="drawing-teaser__photo">
              {teaser.image && (
                <MediaImage
                  className={`drawing-teaser__image${teaser.imageMobile ? " drawing-teaser__image--wide" : ""}`}
                  src={teaser.image.url}
                  alt={teaser.image.alt}
                  fill
                  sizes="(max-width: 640px) 100vw, 22rem"
                />
              )}
              {/* Phone layout only. Each is lazy, so a screen fetches just the one it shows. */}
              {teaser.imageMobile && (
                <MediaImage
                  className="drawing-teaser__image drawing-teaser__image--phone"
                  src={teaser.imageMobile.url}
                  alt={teaser.imageMobile.alt}
                  fill
                  sizes="100vw"
                />
              )}
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
