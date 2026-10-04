/**
 * Previous / next arrows around a row of page dots, for a sideways scroller on the
 * phone layout (see `useScrollPager`). The dots are a readout only; the arrows and
 * a swipe do the moving.
 */
export function ScrollPager({
  page,
  pages,
  onStep,
  label,
}: Readonly<{
  page: number;
  pages: number;
  onStep: (direction: 1 | -1) => void;
  /** What is being paged through, e.g. "collaborators". */
  label: string;
}>) {
  if (pages < 2) return null;

  return (
    <div className="scroll-pager">
      <button
        type="button"
        aria-label={`Previous ${label}`}
        disabled={page === 0}
        onClick={() => onStep(-1)}
      >
        &#8249;
      </button>
      <span className="scroll-pager__dots" role="img" aria-label={`Page ${page + 1} of ${pages}`}>
        {Array.from({ length: pages }, (_, index) => (
          <i key={index} className={index === page ? "is-active" : undefined} />
        ))}
      </span>
      <button
        type="button"
        aria-label={`Next ${label}`}
        disabled={page === pages - 1}
        onClick={() => onStep(1)}
      >
        &#8250;
      </button>
    </div>
  );
}
