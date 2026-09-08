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

  if (unoptimized || isPlaceholderImageSrc(displaySrc)) {
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
