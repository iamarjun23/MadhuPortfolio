/* Work projects carry a YouTube link instead of an uploaded video, so both the
   public board and the studio editor need to read an id out of whatever form of
   YouTube address was pasted. */

// Every YouTube video id is 11 characters from this set. Anything else is not a video, and is
// never put into an embed or thumbnail path where `../` or a query could change the address.
const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

export function getYouTubeId(value: string | null) {
  if (!value) return null;

  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");
    let id: string | null | undefined;
    if (host === "youtu.be") {
      id = url.pathname.split("/").filter(Boolean)[0];
    } else if (host === "youtube.com" || host === "m.youtube.com") {
      id = url.searchParams.get("v") ?? url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1];
    }
    return id && VIDEO_ID.test(id) ? id : null;
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
