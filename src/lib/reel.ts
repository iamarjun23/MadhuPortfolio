import { getInstagramEmbed, getInstagramThumbnail } from "@/lib/instagram";
import { realImage } from "@/lib/placeholders";
import { getLinkedInEmbed, getLinkedInThumbnail } from "@/lib/linkedin";
import { getYouTubeId, getYouTubeThumbnail } from "@/lib/youtube";

/* A reel is the same thing on the work board and on the Drawing Room pinboard:
   a link somebody pasted, or a file they uploaded, that shows a still on the card
   and plays in a pop-up. Both boards resolve it through here so a link that works
   in one always works the same way in the other. */

export type ReelKind = "youtube" | "linkedin" | "instagram" | "upload" | "other" | "none";

export type Reel = Readonly<{
  kind: ReelKind;
  /** Address of the still to put on the card, or null when there is none. */
  thumbnail: string | null;
  /* The editor's own cover photo. YouTube derives its still from the link alone,
     but Instagram publishes no address anyone can compute and LinkedIn's has to
     be fetched, so a card whose still cannot be worked out automatically falls
     back to this - and a cover set deliberately outranks an automatic one. */
  cover: string | null;
  /** Page to embed in the pop-up. Null for an upload, which plays directly. */
  embed: string | null;
  /** Uploaded file to play in the pop-up, when the reel is an upload. */
  file: string | null;
  /** Still for an uploaded file, when one was set. */
  poster: string | null;
  /** The original address, for the "open it yourself" fallback. */
  href: string | null;
  /** Whether the pop-up can play this in place at all. */
  playable: boolean;
  /** A thumbnail fetched rather than computed, so an <img> may still fail. */
  thumbnailCanFail: boolean;
}>;

const empty: Reel = {
  kind: "none",
  thumbnail: null,
  cover: null,
  embed: null,
  file: null,
  poster: null,
  href: null,
  playable: false,
  thumbnailCanFail: false,
};

type ReelInput = Readonly<{
  href?: string | null;
  video?: Readonly<{ url: string; poster?: string }> | null;
  image?: Readonly<{ url: string; alt?: string }> | null;
}>;

export function resolveReel({ href = null, video = null, image = null }: ReelInput): Reel {
  const cover = realImage(image)?.url ?? null;
  /* An uploaded file wins over a link: someone who has gone to the trouble of
     uploading the video wants that played, not a link left over beside it. */
  if (video?.url) {
    return {
      ...empty,
      kind: "upload",
      file: video.url,
      poster: video.poster ?? null,
      thumbnail: cover ?? video.poster ?? null,
      cover,
      href,
      playable: true,
    };
  }

  if (!href) return cover ? { ...empty, cover, thumbnail: cover } : empty;

  if (getYouTubeId(href)) {
    return {
      ...empty,
      kind: "youtube",
      thumbnail: cover ?? getYouTubeThumbnail(href),
      cover,
      embed: `https://www.youtube-nocookie.com/embed/${getYouTubeId(href)}?rel=0`,
      href,
      playable: true,
    };
  }

  const instagram = getInstagramEmbed(href);
  if (instagram) {
    return {
      ...empty,
      kind: "instagram",
      thumbnail: cover ?? getInstagramThumbnail(href),
      cover,
      embed: instagram,
      href,
      playable: true,
      // Only the fetched address can fail; a cover the editor uploaded cannot.
      thumbnailCanFail: !cover,
    };
  }

  const linkedIn = getLinkedInEmbed(href);
  if (linkedIn) {
    return {
      ...empty,
      kind: "linkedin",
      thumbnail: cover ?? getLinkedInThumbnail(href),
      cover,
      embed: linkedIn,
      href,
      playable: true,
      thumbnailCanFail: !cover,
    };
  }

  return { ...empty, kind: "other", thumbnail: cover, cover, href };
}

/* The two-letter mark a card wears when it has no still of its own, so the badge
   still says where the reel lives. */
export function reelBadge(kind: ReelKind) {
  switch (kind) {
    case "linkedin":
      return "in";
    case "instagram":
      return "IG";
    case "youtube":
    case "upload":
      return "▶";
    default:
      return "↗";
  }
}

export function reelSourceLabel(kind: ReelKind) {
  switch (kind) {
    case "youtube":
      return "YouTube video";
    case "linkedin":
      return "LinkedIn post";
    case "instagram":
      return "Instagram reel";
    case "upload":
      return "Uploaded video";
    case "other":
      return "Link";
    case "none":
      return "Nothing yet";
  }
}

/* What to actually put on the card once the browser has had its say: a fetched
   still that failed to load steps aside for the editor's cover photo, and only
   then does the card fall back to its gradient. */
export function reelThumbnail(reel: Reel, fetchFailed: boolean) {
  if (fetchFailed && reel.thumbnailCanFail) return reel.cover;
  return reel.thumbnail;
}
