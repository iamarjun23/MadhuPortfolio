/* A project can point at a LinkedIn post instead of a YouTube video. LinkedIn
   has no predictable thumbnail URL the way YouTube does, but every public post
   has an embed of its own, so the pop-up can still play it in place rather
   than sending the visitor away. A still for the card comes from our own
   `/api/linkedin-thumb` route, which fetches the post's preview image on the
   card's behalf - see that route for why this cannot be a plain image URL. */

const URN_TYPES: Readonly<Record<string, string>> = {
  activity: "activity",
  share: "share",
  ugcpost: "ugcPost",
};

export function getLinkedInUrn(value: string | null) {
  if (!value) return null;

  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");
    if (host !== "linkedin.com" && !host.endsWith(".linkedin.com")) return null;

    /* Two address shapes reach us: the feed permalink, which carries the urn
       itself, and the share link a post's own menu copies, which buries the
       activity id between the slug and the tracking hash. */
    const path = decodeURIComponent(url.pathname);
    const urn = path.match(/urn:li:(activity|share|ugcpost):(\d+)/i);
    if (urn) {
      const type = URN_TYPES[urn[1]!.toLowerCase()];
      return type ? `urn:li:${type}:${urn[2]}` : null;
    }

    const activity = path.match(/-activity-(\d+)/);
    return activity ? `urn:li:activity:${activity[1]}` : null;
  } catch {
    return null;
  }
}

export function getLinkedInEmbed(value: string | null) {
  const urn = getLinkedInUrn(value);
  return urn ? `https://www.linkedin.com/embed/feed/update/${urn}` : null;
}

/* Routed through our own origin rather than linked straight at LinkedIn's CDN:
   the image lives at a URL only the post's own page markup knows, so something
   has to fetch that page first. Proxying it also means the browser only ever
   talks to us, and neither next/image nor the CSP need LinkedIn's media host
   added to their allow-list. The route itself resolves the address to nothing
   when the fetch, or the post, does not cooperate - callers should treat a
   failed <img> load the same as a missing thumbnail. */
export function getLinkedInThumbnail(value: string | null) {
  const urn = getLinkedInUrn(value);
  return urn ? `/api/linkedin-thumb?url=${encodeURIComponent(value!)}` : null;
}
