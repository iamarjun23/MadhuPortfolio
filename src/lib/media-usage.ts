import { getDb } from "@/lib/db";
import { studioSectionLabels } from "@/lib/studio-nav";
import { uploadEndpointNames } from "@/lib/upload-endpoints";
import { Status } from "@/generated/prisma/client";

/* Nothing joins an upload to the section using it: media rows carry a key and
   sections carry free-form JSON, with no foreign key between them. Working out
   whether a file is still in use therefore means reading the stored JSON and
   collecting the uploads out of it, which is what everything here is for. */

/* An upload is recognised by its object key (`<endpoint>/<uuid>`) wherever it
   appears in a string, not by the address around it: the media domain's URL, a
   hand-typed variant and a pre-migration `/api/media/...` path all name the same
   file. Keying on a URL prefix instead would make every file look unused - and
   swept - the moment that prefix changed or was unset. */
const uploadedKey = new RegExp(`(?:${uploadEndpointNames.join("|")})/[0-9a-f-]{36}`, "g");

function collectUploadedKeys(value: unknown, into: Set<string>) {
  if (typeof value === "string") {
    for (const match of value.matchAll(uploadedKey)) into.add(match[0]);
    return;
  }
  if (Array.isArray(value)) {
    for (const entry of value) collectUploadedKeys(entry, into);
    return;
  }
  if (value !== null && typeof value === "object") {
    for (const entry of Object.values(value)) collectUploadedKeys(entry, into);
  }
}

function placeLabel(key: string, status: Status) {
  const label = studioSectionLabels[key as keyof typeof studioSectionLabels] ?? key;
  return status === Status.PUBLISHED ? `${label} (live)` : label;
}

/* Every upload key any section still points at, mapped to the places that
   point at it. Drafts and the published rows are both read: a file the live site
   is serving must not be removable just because the draft no longer uses it. */
export async function getMediaUsage(): Promise<Map<string, string[]>> {
  const sections = await getDb().section.findMany({
    select: { key: true, status: true, data: true },
  });
  const usage = new Map<string, string[]>();

  for (const section of sections) {
    const keys = new Set<string>();
    collectUploadedKeys(section.data, keys);
    for (const mediaKey of keys) {
      const places = usage.get(mediaKey) ?? [];
      places.push(placeLabel(section.key, section.status));
      usage.set(mediaKey, places);
    }
  }

  return usage;
}

/* Same lookup as getMediaUsage, narrowed to one upload: a `LIKE` filter at the database
   lets Postgres skip sections whose JSON text can't contain the key at all, instead
   of pulling and deep-walking every section's JSON just to check one file. */
export async function getMediaUsageForKey(mediaKey: string): Promise<string[]> {
  const sections = await getDb().$queryRaw<{ key: string; status: Status; data: unknown }[]>`
    SELECT key, status, data FROM "Section" WHERE data::text LIKE ${`%${mediaKey}%`}
  `;
  const places: string[] = [];
  for (const section of sections) {
    const keys = new Set<string>();
    collectUploadedKeys(section.data, keys);
    if (keys.has(mediaKey)) places.push(placeLabel(section.key, section.status));
  }
  return places;
}

export function describePlaces(places: readonly string[]) {
  if (places.length === 1) return places[0];
  return `${places.slice(0, -1).join(", ")} and ${places[places.length - 1]}`;
}
