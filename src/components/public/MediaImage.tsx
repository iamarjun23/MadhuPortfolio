import Image from "next/image";

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
}>;

// Uploaded photos are served straight from R2's custom domain, off the Worker entirely.
// Sending them through next/image's optimizer would put every resize back on the Worker's
// CPU budget, and the objects already carry an immutable year-long cache lifetime. A
// not-yet-rewritten `/api/media/` path reaches the same file through the redirect in next.config.
function isUploadedMediaSrc(url: string) {
  const mediaUrl = process.env.NEXT_PUBLIC_MEDIA_URL;
  return url.startsWith("/api/media/") || (Boolean(mediaUrl) && url.startsWith(`${mediaUrl}/`));
}

export function MediaImage({
  src,
  alt,
  sizes,
  fill = false,
  width,
  height,
  onError,
  unoptimized,
}: MediaImageProps) {
  if (unoptimized || isUploadedMediaSrc(src)) {
    return fill ? (
      <Image src={src} alt={alt} fill sizes={sizes} unoptimized onError={onError} />
    ) : (
      <Image
        src={src}
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
    <Image src={src} alt={alt} fill sizes={sizes} onError={onError} />
  ) : (
    <Image src={src} alt={alt} width={width} height={height} sizes={sizes} onError={onError} />
  );
}
