import Link from "next/link";
import { MediaImage } from "@/components/public/MediaImage";
import type { Room } from "@/schemas";

export function DrawingRoomTeaser({ data }: Readonly<{ data: Room }>) {
  const teaser = data.teaser;

  return (
    <section className="section" id="drawing-room">
      <div className="wrap">
        <div className="drawing-teaser">
          <div className="drawing-teaser__copy">
            <span className="slate">{teaser.eyebrow}</span>
            <p className="drawing-teaser__kicker">{teaser.kicker}</p>
            <h2>
              {teaser.heading} <em>{teaser.headingAccent}</em>
            </h2>
            <p>{teaser.description}</p>
            <Link className="drawing-teaser__link" href="/room">
              {teaser.ctaLabel} <span aria-hidden="true">↗</span>
            </Link>
          </div>
          <Link
            className="drawing-teaser__archive"
            href="/room"
            aria-label="Open the Drawing Room"
          >
            {teaser.image && (
              <MediaImage
                className="drawing-teaser__image"
                src={teaser.image.url}
                alt={teaser.image.alt}
                fill
                sizes="(max-width: 560px) 20rem, 32vw"
              />
            )}
            <span className="drawing-teaser__stamp">{teaser.stamp}</span>
            <span className="drawing-teaser__note">{teaser.note}</span>
            <b>{teaser.invitation}</b>
            <i>{teaser.invitationNote}</i>
          </Link>
        </div>
      </div>
    </section>
  );
}
