type Size = Readonly<{ width: number; height: number }>;

/* The Studio preview lays a section out at its real size and then zooms it into
   the pane. "Whole" shows every pixel of the section at once; otherwise only the
   width is fitted and the pane scrolls down the rest. A preview is never enlarged
   past 100%, and a content size that has not been measured yet leaves it at 100%. */
export function previewScale(pane: Size, content: Size, whole: boolean) {
  if (!(content.width > 0) || !(content.height > 0)) return 1;
  const byWidth = pane.width / content.width;
  const scale = whole ? Math.min(byWidth, pane.height / content.height) : byWidth;
  return scale > 0 ? Math.min(1, scale) : 1;
}

/* Left to itself the preview shows the whole section, unless that would cost it
   more than a tenth of the size it gets from fitting the width alone: a tall
   section shrunk further than that gets hard to read and click, so it scrolls
   instead. */
export function wholeIsReadable(pane: Size, content: Size) {
  return previewScale(pane, content, true) >= 0.9 * previewScale(pane, content, false);
}
