// Next renders this instantly on navigation while the section's server component
// (auth check + draft reads) is still in flight, instead of leaving the click with
// no feedback until the whole round trip finishes. It is shaped like the editor it
// stands in for - preview beside panel - so a tab switch does not jump.
export default function StudioLoading() {
  return (
    <section className="studio-page studio-skeleton" aria-busy="true" aria-label="Loading">
      <span className="skeleton" />
      <span className="skeleton" />
    </section>
  );
}
