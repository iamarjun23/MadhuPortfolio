import { realImage } from "@/lib/placeholders";
import type { Clients } from "@/schemas";

// Same seamless-loop trick as Testimonials: one copy of the track must outrun any
// viewport, so short lists are repeated before the whole set is doubled.
const ITEM_SPAN = 240;
const MIN_TRACK_WIDTH = 2600;

export function ClientsMarquee({ data }: Readonly<{ data: Clients }>) {
  if (data.clients.length === 0) return null;

  const repeats = Math.max(1, Math.ceil(MIN_TRACK_WIDTH / (ITEM_SPAN * data.clients.length)));
  const set = Array.from({ length: repeats }, () => data.clients).flat();

  return (
    <section className="clients" aria-label={data.heading}>
      <div className="wrap">
        <h2 className="slate">{data.heading}</h2>
      </div>
      <div className="clients__marquee">
        <ul className="clients__track" style={{ animationDuration: `${set.length * 3}s` }}>
          {[...set, ...set].map((client, i) => {
            const logo = realImage(client.logo);
            return (
              // Only the first copy is read out; the rest exist for the loop.
              <li key={`${client.name}-${i}`} aria-hidden={i >= data.clients.length || undefined}>
                {logo ? (
                  // eslint-disable-next-line @next/next/no-img-element -- small lazy logo, not LCP
                  <img src={logo.url} alt="" loading="lazy" />
                ) : null}
                <span>{client.name}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
