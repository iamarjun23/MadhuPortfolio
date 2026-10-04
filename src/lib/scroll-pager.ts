/**
 * Which page a sideways scroller is on, and how many it has. A page is one full
 * width of the scroller plus the `gap` that separates it from the next.
 */
export function pagerState(scrollLeft: number, clientWidth: number, scrollWidth: number, gap = 0) {
  if (clientWidth <= 0) return { page: 0, pages: 1 };
  const span = clientWidth + gap;
  const pages = Math.max(1, Math.round((scrollWidth + gap) / span));
  const page = Math.min(pages - 1, Math.max(0, Math.round(scrollLeft / span)));
  return { page, pages };
}
