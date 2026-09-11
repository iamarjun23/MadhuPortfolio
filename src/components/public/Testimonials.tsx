import type { Praise } from "@/schemas";

// Card width (incl. gap) used to size the marquee. Keep in sync with .testimonials figure in base.css.
const CARD_SPAN = 496;
// A single copy of the track must be wider than any real viewport, or the duplicate
// copy used for the seamless loop would become visible at the same time as the original.
const MIN_TRACK_WIDTH = 2600;

export function Testimonials({ data }: Readonly<{ data: Praise }>) {
  if (!data.visible || data.quotes.length === 0) return null;

  const repeats = Math.max(1, Math.ceil(MIN_TRACK_WIDTH / (CARD_SPAN * data.quotes.length)));
  const set = Array.from({ length: repeats }, () => data.quotes).flat();
  const duration = set.length * 4;

  return (
    <section className="section" id="testimonials">
      <div className="wrap">
        <header className="section-heading">
          <span className="slate">{data.eyebrow}</span>
          <h2>{data.heading}</h2>
        </header>
        <div className="testimonials">
          <div className="testimonials__track" style={{ animationDuration: `${duration}s` }}>
            {[...set, ...set].map((quote, i) => (
              <figure className={quote.isSample ? "is-sample" : undefined} key={`${quote.id}-${i}`}>
                <blockquote>{quote.quote}</blockquote>
                <figcaption>
                  <span>{quote.initials}</span>
                  <div>
                    <b>{quote.name}</b>
                    <small>{quote.role}</small>
                  </div>
                  {quote.isSample ? <small>{data.sampleLabel}</small> : null}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
