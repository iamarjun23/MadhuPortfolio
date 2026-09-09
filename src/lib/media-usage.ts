import { getDb } from "@/lib/db";
import { studioSectionLabels } from "@/lib/studio-nav";
import { Status } from "@/generated/prisma/client";

/* Nothing joins an upload to the section using it: media rows carry a URL and
   sections carry free-form JSON, with no foreign key between them. Working out
   whether a file is still in use therefore means reading the stored JSON and
   collecting the addresses out of it, which is what everything here is for. */

const UPLOADED_PREFIX = "/api/media/";

/* Uploads are stored as the site-relative `/api/media/...` path, which is what
   the studio writes and what the media row records. A field can still be typed
   by hand, though, and the schema accepts a complete https address - so the same
   file written as `https://the-site/api/media/...` has to be recognised too, or
   the sweep would read it as unreferenced and delete a file the site is using. */
function toUploadedPath(value: string) {
  if (value.startsWith(UPLOADED_PREFIX)) return value;
  if (!value.includes(UPLOADED_PREFIX)) return undefined;
  try {
    const { pathname } = new URL(value);
    return pathname.startsWith(UPLOADED_PREFIX) ? pathname : undefined;
  } catch {
    return undefined;
  }
}

function collectUploadedUrls(value: unknown, into: Set<string>) {
  if (typeof value === "string") {
    const path = toUploadedPath(value);
    if (path) into.add(path);
    return;
  }
  if (Array.isArray(value)) {
    for (const entry of value) collectUploadedUrls(entry, into);
    return;
  }
  if (value !== null && typeof value === "object") {
    for (const entry of Object.values(value)) collectUploadedUrls(entry, into);
  }
}

function placeLabel(key: string, status: Status) {
  const label = studioSectionLabels[key as keyof typeof studioSectionLabels] ?? key;
  return status === Status.PUBLISHED ? `${label} (live)` : label;
}

/* Every uploaded address any section still points at, mapped to the places that
   point at it. Drafts and the published rows are both read: a file the live site
   is serving must not be removable just because the draft no longer uses it. */
export async function getMediaUsage(): Promise<Map<string, string[]>> {
  const sections = await getDb().section.findMany({
    select: { key: true, status: true, data: true },
  });
  const usage = new Map<string, string[]>();

  for (const section of sections) {
    const urls = new Set<string>();
    collectUploadedUrls(section.data, urls);
    for (const url of urls) {
      const places = usage.get(url) ?? [];
      places.push(placeLabel(section.key, section.status));
      usage.set(url, places);
    }
  }

  return usage;
}

/* Same lookup as getMediaUsage, narrowed to one URL: a `LIKE` filter at the database
   lets Postgres skip sections whose JSON text can't contain the address at all, instead
   of pulling and deep-walking every section's JSON just to check one file. */
export async function getMediaUsageForUrl(url: string): Promise<string[]> {
  const sections = await getDb().$queryRaw<{ key: string; status: Status; data: unknown }[]>`
    SELECT key, status, data FROM "Section" WHERE data::text LIKE ${`%${url}%`}
  `;
  const places: string[] = [];
  for (const section of sections) {
    const urls = new Set<string>();
    collectUploadedUrls(section.data, urls);
    if (urls.has(url)) places.push(placeLabel(section.key, section.status));
  }
  return places;
}

export function describePlaces(places: readonly string[]) {
  if (places.length === 1) return places[0];
  return `${places.slice(0, -1).join(", ")} and ${places[places.length - 1]}`;
}
