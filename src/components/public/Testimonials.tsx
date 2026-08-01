import type { Praise } from "@/schemas";
export function Testimonials({ data }: Readonly<{ data: Praise }>) {
  return (
    <section className="section" id="testimonials">
      <div className="wrap">
        <header className="section-heading">
          <span className="slate">Praise</span>
          <h2>What people say</h2>
        </header>
        <div className="testimonials">
          {data.quotes.map((quote) => (
            <figure key={quote.id}>
              <blockquote>{quote.quote}</blockquote>
              <figcaption>
                <span>{quote.initials}</span>
                <div>
                  <b>{quote.name}</b>
                  <small>{quote.role}</small>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
