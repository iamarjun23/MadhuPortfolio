import Image from "next/image";
import { loaderSourceUrl } from "@/lib/media-src";

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
  // For an image inside a draggable card, so dragging moves the card, not the picture.
  draggable?: boolean;
  className?: string;
}>;

/* Uploads and our LinkedIn/Instagram thumbnail routes go through the Cloudflare loader
   (src/lib/image-loader.ts), which asks for each one at the width the layout needs instead
   of shipping the full-size original. Any other source - a YouTube still - is served as it
   is: those are already small, and next/image's built-in optimizer would resize them on
   the Worker's CPU budget. */
export function MediaImage({
  src,
  alt,
  sizes,
  fill = false,
  width,
  height,
  onError,
  draggable,
  className,
}: MediaImageProps) {
  const skipLoader = !loaderSourceUrl(src);
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
