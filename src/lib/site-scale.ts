/** The desktop container width (base.css's #top .wrap max-width). */
export const DESIGN_WIDTH = 1280;
/** Widest window that gets the phone layout (the `max-width` in mobile.css). */
export const PHONE_MAX_WIDTH = 640;

/**
 * How far the public page is zoomed for a window `width` px wide. Below the design
 * width the desktop layout is shrunk as a whole rather than reflowed; a page that has
 * a phone layout (`phoneMaxWidth` above 0) is left at full size once the window is
 * narrow enough for that layout to take over.
 *
 * Self-contained on purpose: the public layout inlines this function's source into
 * the page, so it may not reach for anything outside its own arguments.
 */
export function siteScale(width: number, designWidth: number, phoneMaxWidth: number) {
  if (width <= phoneMaxWidth) return 1;
  return Math.min(1, width / designWidth);
}
