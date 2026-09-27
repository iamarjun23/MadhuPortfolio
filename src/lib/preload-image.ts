import { getImageProps } from "next/image";
import { loaderSourceUrl } from "@/lib/media-src";

/** The photo viewers' `sizes` (the mood-player styles cap the photo at min(64vw, 820px)). */
export const PHOTO_VIEWER_SIZES = "(max-width: 820px) 92vw, min(64vw, 820px)";

/** Starts downloading the copy of `src` a photo viewer will show, so opening it is instant.
    Called when a tile is hovered, focused or touched; the browser cache dedupes repeats.
    The srcset is built exactly as MediaImage builds the viewer's, so it picks the same file. */
export function preloadViewerPhoto(src: string) {
  const { props } = getImageProps({
    src,
    alt: "",
    width: 1600,
    height: 1200,
    sizes: PHOTO_VIEWER_SIZES,
    unoptimized: !loaderSourceUrl(src),
  });
  const image = new window.Image();
  image.sizes = PHOTO_VIEWER_SIZES;
  if (props.srcSet) image.srcset = props.srcSet;
  image.src = props.src;
}
