/* Work projects carry a YouTube link instead of an uploaded video, so both the
   public board and the studio editor need to read an id out of whatever form of
   YouTube address was pasted. */

export function getYouTubeId(value: string | null) {
  if (!value) return null;

  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return url.pathname.split("/").filter(Boolean)[0] ?? null;
    if (host !== "youtube.com" && host !== "m.youtube.com") return null;

    const pathId = url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1];
    return url.searchParams.get("v") ?? pathId ?? null;
  } catch {
    return null;
  }
}

/* `hqdefault` is the largest still YouTube generates for every video, so unlike
   `maxresdefault` it never 404s on older or lower-resolution uploads. */
export function getYouTubeThumbnail(value: string | null) {
  const id = getYouTubeId(value);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}
