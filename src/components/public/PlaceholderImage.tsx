import Image from "next/image";
import { displayImageSrc, isPlaceholderImageSrc } from "@/lib/placeholders";

type PlaceholderImageProps = Readonly<{
  src: string;
  alt: string;
  sizes: string;
  fill?: boolean;
  width?: number;
  height?: number;
  // Only meaningful from a client component - e.g. a card that wants to fall
  // back to its gradient when a fetched preview (a LinkedIn thumbnail, say)
  // does not resolve to a real image.
  onError?: () => void;
  // Skips next/image's own optimizer. Needed for a source whose query string
  // next/image will not touch without it being named in `images.localPatterns`
  // - our own LinkedIn thumbnail route carries a different `url=` on every
  // card, so it cannot be named there. The route already returns a
  // reasonably-sized image with its own long cache lifetime, so there is
  // nothing left for the optimizer to usefully do anyway.
  unoptimized?: boolean;
}>;

// next/image's optimizer cannot read an uploaded photo. On Workers, OpenNext resolves a
// same-origin `url=` through the ASSETS binding, which only serves the build's static
// files - our media lives in R2 behind the `/api/media/[...key]` route, so the lookup
// misses and `/_next/image` answers 404 ("upstream response is invalid"), leaving every
// uploaded photo broken while the bundled placeholders kept working. The route already
// serves the stored file with an immutable year-long cache lifetime, so going direct
// costs nothing but the optimizer's resizing.
function isUploadedMediaSrc(url: string) {
  return url.startsWith("/api/media/");
}

export function PlaceholderImage({
  src,
  alt,
  sizes,
  fill = false,
  width,
  height,
  onError,
  unoptimized,
}: PlaceholderImageProps) {
  const displaySrc = displayImageSrc(src);

  if (unoptimized || isUploadedMediaSrc(displaySrc) || isPlaceholderImageSrc(displaySrc)) {
    return fill ? (
      <Image src={displaySrc} alt={alt} fill sizes={sizes} unoptimized onError={onError} />
    ) : (
      <Image
        src={displaySrc}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        unoptimized
        onError={onError}
      />
    );
  }

  return fill ? (
    <Image src={displaySrc} alt={alt} fill sizes={sizes} onError={onError} />
  ) : (
    <Image src={displaySrc} alt={alt} width={width} height={height} sizes={sizes} onError={onError} />
  );
}
