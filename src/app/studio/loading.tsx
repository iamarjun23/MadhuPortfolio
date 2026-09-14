// Next renders this instantly on navigation while the section's server component
// (auth check + draft reads) is still in flight, instead of leaving the click with
// no feedback until the whole round trip finishes.
export default function StudioLoading() {
  return (
    <section className="studio-page studio-skeleton" aria-busy="true" aria-label="Loading">
      <span className="skeleton" style={{ width: "9rem", height: "0.8rem" }} />
      <span className="skeleton" style={{ width: "min(32rem, 90%)", height: "3.2rem" }} />
      <span className="skeleton" style={{ width: "min(40rem, 100%)", height: "1rem" }} />
      <span className="skeleton" style={{ width: "min(28rem, 80%)", height: "1rem" }} />
      <div className="studio-skeleton__grid">
        {Array.from({ length: 4 }, (_, i) => (
          <span className="skeleton" key={i} style={{ height: "6rem" }} />
        ))}
      </div>
      <span className="skeleton" style={{ width: "100%", height: "18rem" }} />
    </section>
  );
}
