import type { Praise } from "@/schemas";
export function Testimonials({ data }: Readonly<{ data: Praise }>) {
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
    </section>
  );
}
