import { MediaImage } from "@/components/public/MediaImage";
import { SectionTimeline } from "@/components/public/SectionTimeline";
import type { TimelinePosition } from "@/lib/section-timeline";
import { realImage } from "@/lib/placeholders";
import type { Clients } from "@/schemas";

// Same seamless-loop trick as Testimonials: one copy of the track must outrun any
// viewport, so short lists are repeated before the whole set is doubled.
const ITEM_SPAN = 240;
const MIN_TRACK_WIDTH = 2600;

export function ClientsMarquee({
  data,
  timeline,
  editable = false,
}: Readonly<{
  data: Clients;
  timeline?: TimelinePosition;
  /** Studio preview only: each logo names its entry, so a click opens that company. */
  editable?: boolean;
}>) {
  if (data.clients.length === 0) return null;

  const repeats = Math.max(1, Math.ceil(MIN_TRACK_WIDTH / (ITEM_SPAN * data.clients.length)));
  const set = Array.from({ length: repeats }, () => data.clients).flat();

  return (
    <section className="clients" aria-label={data.heading}>
      <div className="wrap">
        <SectionTimeline label={data.heading} position={timeline} />
      </div>
      <div className="clients__marquee">
        <ul className="clients__track" style={{ animationDuration: `${set.length * 3}s` }}>
          {[...set, ...set].map((client, i) => {
            const logo = realImage(client.logo);
            return (
              // Only the first copy is read out; the rest exist for the loop.
              <li
                key={`${client.name}-${i}`}
                aria-hidden={i >= data.clients.length || undefined}
                data-studio-path={editable ? `clients.${i % data.clients.length}` : undefined}
              >
                {logo ? (
                  // Nominal size only: the CSS sets the height and keeps the logo's own shape.
                  // Named clients read out via the span; a logo-only client needs its own alt.
                  <MediaImage
                    src={logo.url}
                    alt={client.name ? "" : "Client logo"}
                    width={160}
                    height={72}
                    sizes="160px"
                  />
                ) : null}
                {client.name ? <span>{client.name}</span> : null}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
