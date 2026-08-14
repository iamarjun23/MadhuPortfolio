const placeholderImagePath = "/placeholders/photo.svg";
const placeholderOrigin = "https://madhu.edit";

export function placeholderImageUrl(_label: string, _width = 1200, _height = 900) {
  return new URL(placeholderImagePath, placeholderOrigin).toString();
}

export function displayImageSrc(url: string) {
  if (url.startsWith(`${placeholderOrigin}/`) || url.includes("placehold.co")) {
    return placeholderImagePath;
  }

  return url;
}

export function isPlaceholderImageSrc(url: string) {
  return url === placeholderImagePath;
}
