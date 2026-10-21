const PICTURE_TYPES = new Set(["polaroid", "video", "ig"]);
const CARDS_PER_PAGE = 3;
const PICTURES_PER_PAGE = 2;

/** Splits the mood board's cards, in board order, into the pages of the phone
    sketchbook: at most two picture cards and three cards to a page, so a page
    fits a phone screen whole and nothing on it is cut off. */
export function sketchbookPages<T extends { type: string }>(cards: readonly T[]): T[][] {
  const pages: T[][] = [];
  let page: T[] = [];

  for (const card of cards) {
    const pictures = page.filter((onPage) => PICTURE_TYPES.has(onPage.type)).length;
    const pageFull =
      page.length === CARDS_PER_PAGE ||
      (PICTURE_TYPES.has(card.type) && pictures === PICTURES_PER_PAGE);
    if (pageFull) {
      pages.push(page);
      page = [];
    }
    page.push(card);
  }

  if (page.length) pages.push(page);
  return pages;
}
