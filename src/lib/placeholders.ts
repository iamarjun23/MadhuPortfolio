/* No artwork is bundled with the site any more. A section with no picture set
   shows the owner's own stand-in photo when they have uploaded one in Site &
   Navigation, and its own empty state - initials, a colour wash, a gradient -
   when they have not.
 *
 * Content saved before that change still carries the address of the retired
 * placeholder file, and older rows carry a placehold.co address, so those two
 * are read as "nothing set" wherever a picture is used. */
const retiredPlaceholderUrls = ["/placeholders/photo.svg", "placehold.co"];

export function isPlaceholderImageSrc(url: string) {
  return retiredPlaceholderUrls.some((pattern) => url.includes(pattern));
}

/* The picture to show, or null when there is none to show. Every consumer of an
   uploaded image goes through this, so a retired placeholder never reaches the
   page. */
export function realImage<TImage extends { url: string }>(
  image: TImage | null | undefined,
): TImage | null {
  return image && !isPlaceholderImageSrc(image.url) ? image : null;
}

/* The site-wide stand-in, set in Site & Navigation. Null until the owner
   uploads one, which is the ordinary case. */
export type FallbackImage = Readonly<{ url: string }> | null;

/* The picture to hang in one slot: the slot's own, or the stand-in when it has
   none and one has been uploaded. `alt` describes the slot, not the stand-in -
   what the visitor is looking at is this collaborator, this polaroid, this
   scene, whichever picture ends up filling it. */
export function imageOrFallback(
  image: Readonly<{ url: string; alt?: string }> | null | undefined,
  fallback: FallbackImage,
  alt: string,
): Readonly<{ url: string; alt: string }> | null {
  const own = realImage(image);
  if (own) return { url: own.url, alt: own.alt ?? alt };
  return fallback ? { url: fallback.url, alt } : null;
}
