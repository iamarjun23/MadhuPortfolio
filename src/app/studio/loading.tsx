// Next renders this instantly on navigation while the section's server component
// (auth check + draft reads over Hyperdrive) is still in flight, instead of leaving
// the click with no feedback until the whole round trip finishes.
export default function StudioLoading() {
  return (
    <section className="studio-page" aria-busy="true">
      <p className="slate">Loading…</p>
    </section>
  );
}
