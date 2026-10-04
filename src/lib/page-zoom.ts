/* The public layout zooms <html> down below the design width, and the Studio
   zooms its preview to fit the pane. Pointer and rect coordinates stay in screen
   pixels while an element's own offsets are in the page's. `currentCSSZoom` sees
   both zooms; a browser without it only knows about the one on <html>. */
export function pageZoom(node: Element) {
  return node.currentCSSZoom ?? (Number(document.documentElement.style.zoom) || 1);
}
