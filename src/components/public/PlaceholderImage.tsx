import Image from "next/image";
import { displayImageSrc, isPlaceholderImageSrc } from "@/lib/placeholders";

type PlaceholderImageProps = Readonly<{
  src: string;
  alt: string;
  sizes: string;
  fill?: boolean;
  width?: number;
  height?: number;
}>;

export function PlaceholderImage({
  src,
  alt,
  sizes,
  fill = false,
  width,
  height,
}: PlaceholderImageProps) {
  const displaySrc = displayImageSrc(src);

  if (isPlaceholderImageSrc(displaySrc)) {
    return fill ? (
      <Image src={displaySrc} alt={alt} fill sizes={sizes} unoptimized />
    ) : (
      <Image src={displaySrc} alt={alt} width={width} height={height} sizes={sizes} unoptimized />
    );
  }

  return fill ? (
    <Image src={displaySrc} alt={alt} fill sizes={sizes} />
  ) : (
    <Image src={displaySrc} alt={alt} width={width} height={height} sizes={sizes} />
  );
}
