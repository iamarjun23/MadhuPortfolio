import Image from "next/image";
import { isUploadedMediaSrc } from "@/lib/media-src";

type MediaImageProps = Readonly<{
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
  // For an image inside a draggable card, so dragging moves the card, not the picture.
  draggable?: boolean;
  className?: string;
}>;

/* Uploads go through the Cloudflare loader (src/lib/image-loader.ts), which asks for each
   one at the width the layout needs instead of shipping the multi-megabyte original. Any
   other source - a YouTube still, our own LinkedIn/Instagram thumbnail route - is served as
   it is: those are already small, and next/image's built-in optimizer would resize them on
   the Worker's CPU budget. */
export function MediaImage({
  src,
  alt,
  sizes,
  fill = false,
  width,
  height,
  onError,
  unoptimized,
  draggable,
  className,
}: MediaImageProps) {
  const skipLoader = unoptimized || !isUploadedMediaSrc(src);
  return fill ? (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      unoptimized={skipLoader}
      onError={onError}
      draggable={draggable}
      className={className}
    />
  ) : (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      unoptimized={skipLoader}
      onError={onError}
      draggable={draggable}
      className={className}
    />
  );
}
