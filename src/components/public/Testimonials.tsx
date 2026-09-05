import type { Praise } from "@/schemas";
import { PlaceholderImage } from "@/components/public/PlaceholderImage";
export function Testimonials({ data }: Readonly<{ data: Praise }>) {
  if (!data.visible || data.quotes.length === 0) return null;

  return (
    <section className="section" id="testimonials">
      <div className="wrap">
        <header className="section-heading">
          <span className="slate">{data.eyebrow}</span>
          <h2>{data.heading}</h2>
        </header>
        <div className="testimonials">
          {data.quotes.map((quote) => (
            <figure className={quote.isSample ? "is-sample" : undefined} key={quote.id}>
              <blockquote>{quote.quote}</blockquote>
              <figcaption>
                <span>
                  {quote.image ? (
                    <PlaceholderImage
                      src={quote.image.url}
                      alt={quote.image.alt}
                      width={36}
                      height={36}
                      sizes="36px"
                    />
                  ) : (
                    quote.initials
                  )}
                </span>
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
    </section>
  );
}
