/** Where a section sits on the homepage's edit timeline (1-based). */
export type TimelinePosition = { index: number; total: number };

/**
 * Numbers the homepage sections in page order. Hidden sections drop out,
 * so the rest renumber themselves instead of leaving a gap.
 */
export function sectionTimeline<K extends string>(
  sections: ReadonlyArray<readonly [key: K, shown: boolean]>,
): Map<K, TimelinePosition> {
  const shown = sections.filter(([, isShown]) => isShown).map(([key]) => key);
  return new Map(shown.map((key, i) => [key, { index: i + 1, total: shown.length }]));
}
