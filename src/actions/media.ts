"use server";

import { randomUUID } from "node:crypto";
import { requireOwner } from "@/auth";
import { getDb } from "@/lib/db";
import {
  deleteObject,
  headObject,
  isMediaUploadConfigured,
  listObjects,
  mediaPublicUrl,
  readObjectStart,
  signUpload,
} from "@/lib/media-config";
import { SIGNATURE_BYTES, verifiedMimeType } from "@/lib/file-signature";
import {
  type UploadEndpoint,
  isAllowedMimeType,
  isUploadEndpoint,
  normalizeMimeType,
  uploadEndpoints,
} from "@/lib/media-upload";
import {
  describePlaces,
  getMediaUsage,
  getMediaUsageForKey,
  takeMediaReferenceLock,
} from "@/lib/media-usage";
import type {
  CreateUploadResult,
  DeleteMediaResult,
  FinishUploadResult,
  PurgeMediaResult,
  UnusedMediaResult,
} from "@/actions/media-types";

/* An upload only reaches a section when the draft holding it is saved, so a file
   that has just been added is legitimately unreferenced for as long as the editor
   sits open. Sweeping those away would delete the file out from under whoever is
   still working on it, so only uploads old enough to have been abandoned count. */
const ORPHAN_GRACE_MS = 24 * 60 * 60 * 1000;

const uploadKeyPattern = /^([A-Za-z]+)\/[0-9a-f-]{36}$/;

const uploadResultFields = { id: true, url: true, key: true, width: true, height: true } as const;

function describeLimits(endpoint: UploadEndpoint) {
  const { accept, maxBytes } = uploadEndpoints[endpoint];
  const kinds =
    accept === "image/"
      ? "a JPEG, PNG, WebP, AVIF or GIF image"
      : accept === "video/"
        ? "an MP4, WebM or MOV video"
        : "a PDF";
  return `Choose ${kinds} under ${Math.round(maxBytes / (1024 * 1024))}MB.`;
}

async function discard(key: string) {
  try {
    await deleteObject(key);
  } catch (error) {
    console.error(`Could not remove the orphaned upload ${key}`, error);
  }
}

/* Vercel refuses a function request body over 4.5MB, so a file never passes
   through the studio: the browser PUTs it straight to R2 through the URL signed
   here, then calls `finishUpload`. The type and size checked now are only the
   browser's word, which is why `finishUpload` checks them again against what was
   actually stored. */
export async function createUpload(
  endpoint: string,
  contentType: string,
  bytes: number,
): Promise<CreateUploadResult> {
  try {
    await requireOwner();
    if (!isUploadEndpoint(endpoint)) return { ok: false, error: "Unknown upload slot." };

    const config = uploadEndpoints[endpoint];
    if (
      !isAllowedMimeType(contentType, config.accept) ||
      !Number.isSafeInteger(bytes) ||
      bytes <= 0 ||
      bytes > config.maxBytes
    ) {
      return { ok: false, error: describeLimits(endpoint) };
    }
    if (!isMediaUploadConfigured()) return { ok: false, error: "Uploads are not configured." };

    const key = `${endpoint}/${randomUUID()}`;
    return { ok: true, key, uploadUrl: await signUpload(key) };
  } catch {
    return { ok: false, error: "Could not start the upload. Please try again." };
  }
}

export async function finishUpload(key: string): Promise<FinishUploadResult> {
  /* Checked on its own, before anything else: every failure below deletes the
     object, and only the owner may cause that. */
  try {
    await requireOwner();
  } catch {
    return { ok: false, error: "Unauthorised" };
  }

  const endpoint = uploadKeyPattern.exec(key)?.[1];
  if (!endpoint || !isUploadEndpoint(endpoint)) return { ok: false, error: "Unknown upload." };
  const config = uploadEndpoints[endpoint];

  /* A repeated call - a retry, a double click - must hand back the row the first
     one made and never reach the failure paths below, all of which delete the
     object that row points at. Its own try for the same reason: a failed lookup
     must not delete anything either. */
  try {
    const existing = await getDb().media.findUnique({ where: { key }, select: uploadResultFields });
    if (existing) return { ok: true, media: existing };
  } catch (error) {
    console.error(`Looking up the upload ${key} failed`, error);
    return { ok: false, error: "Could not record the upload." };
  }

  try {
    const stored = await headObject(key);
    if (!stored.ok)
      return { ok: false, error: "The file did not reach storage. Please try again." };

    const bytes = Number(stored.headers.get("content-length"));
    const mime = normalizeMimeType(stored.headers.get("content-type") ?? "");
    if (
      !isAllowedMimeType(mime, config.accept) ||
      !Number.isSafeInteger(bytes) ||
      bytes <= 0 ||
      bytes > config.maxBytes
    ) {
      await discard(key);
      return { ok: false, error: describeLimits(endpoint) };
    }

    // The stored type is still only the browser's claim, so check it against the bytes.
    const actualMime = verifiedMimeType(await readObjectStart(key, SIGNATURE_BYTES), mime);
    if (!actualMime) {
      await discard(key);
      return {
        ok: false,
        error: `This file's contents do not match its type. ${describeLimits(endpoint)}`,
      };
    }

    // An upsert, so a concurrent repeat that got past the lookup above cannot trip the unique key.
    const media = await getDb().media.upsert({
      where: { key },
      create: { key, url: mediaPublicUrl(key), kind: config.kind, bytes, mime: actualMime },
      update: {},
      select: uploadResultFields,
    });
    return { ok: true, media };
  } catch (error) {
    console.error(`Recording the upload ${key} failed`, error);
    await discard(key);
    return { ok: false, error: "Could not record the upload." };
  }
}

export async function deleteMedia(mediaId: string): Promise<DeleteMediaResult> {
  try {
    await requireOwner();
    const media = await getDb().media.findUnique({ where: { id: mediaId } });

    if (!media) return { ok: false, error: "This upload no longer exists." };
    if (!isMediaUploadConfigured()) return { ok: false, error: "Uploads are not configured." };

    /* Marked first, outside the removal's transaction so a failure cannot roll the
       mark back: if the object or row delete fails, the unused-media sweep picks
       marked rows up at once and finishes the job (`deleteObject` accepts a key
       that is already gone). Row first instead would leave a file no row points
       at and nothing could find. */
    await getDb().media.update({ where: { id: media.id }, data: { deletingAt: new Date() } });
    const places = await removeIfUnused(media);
    if (places.length > 0) {
      /* Deleting a file a section still points at leaves a broken image behind -
         on the live site, if the published row is one of the places using it. The
         reference has to be cleared in the editor first. */
      await getDb().media.update({ where: { id: media.id }, data: { deletingAt: null } });
      return {
        ok: false,
        error: `Still used by ${describePlaces(places)}. Remove it there first, then delete the file.`,
      };
    }
    return { ok: true };
  } catch (error) {
    console.error(`Deleting the upload ${mediaId} failed`, error);
    return { ok: false, error: "Could not delete this upload. Please try again." };
  }
}

// `id` is null for an object in the bucket that never got a media row.
type Orphan = Readonly<{ id: string | null; key: string; bytes: number | null }>;

/* Rechecks usage under the exclusive reference lock and removes the file and its
   row before any draft save gets through, so nothing can start pointing at the
   file in between (see media-usage.ts). Returns the places still using it - empty
   once it has been removed. */
async function removeIfUnused({ id, key }: Pick<Orphan, "id" | "key">) {
  return getDb().$transaction(
    async (tx) => {
      await takeMediaReferenceLock(tx);
      const places = await getMediaUsageForKey(key, tx);
      if (places.length > 0) return places;
      await deleteObject(key);
      if (id) await tx.media.delete({ where: { id } });
      return [];
    },
    // Longer than the 5s default: the R2 delete runs inside it.
    { timeout: 20_000 },
  );
}

async function findOrphans(): Promise<Orphan[]> {
  const usage = await getMediaUsage();
  const cutoff = new Date(Date.now() - ORPHAN_GRACE_MS);
  const rows = await getDb().media.findMany({
    select: { id: true, key: true, bytes: true, createdAt: true, deletingAt: true },
  });

  // A delete that failed part way skips the grace period: the owner already chose to remove it.
  const abandoned = rows
    .filter((row) => row.deletingAt || row.createdAt < cutoff)
    .map(({ id, key, bytes }) => ({ id, key, bytes }));

  /* An upload abandoned between its PUT and `finishUpload` leaves an object with
     no row. Only keys shaped like our own uploads are considered, so anything put
     in the bucket by hand is never touched. */
  const recorded = new Set(rows.map((row) => row.key));
  const unrecorded = (await listStoredObjects())
    .filter(
      (object) =>
        uploadKeyPattern.test(object.key) &&
        !recorded.has(object.key) &&
        object.lastModified < cutoff,
    )
    .map(({ key, bytes }) => ({ id: null, key, bytes }));

  return [...abandoned, ...unrecorded].filter((media) => !usage.has(media.key));
}

// A bucket that cannot be listed only hides the row-less objects; the rest of the sweep still works.
async function listStoredObjects() {
  if (!isMediaUploadConfigured()) return [];
  try {
    return await listObjects();
  } catch (error) {
    console.error("Listing the media bucket failed", error);
    return [];
  }
}

/* Uploads that were made and then abandoned - the draft was never saved, or the
   field was pointed somewhere else afterwards - keep their R2 object forever with
   nothing in the studio listing them. This is what makes them visible. */
export async function getUnusedMedia(): Promise<UnusedMediaResult> {
  try {
    await requireOwner();
    const orphans = await findOrphans();
    return {
      ok: true,
      summary: {
        count: orphans.length,
        bytes: orphans.reduce((total, media) => total + (media.bytes ?? 0), 0),
      },
    };
  } catch {
    return { ok: false, error: "Could not check for unused uploads." };
  }
}

export async function purgeUnusedMedia(): Promise<PurgeMediaResult> {
  try {
    await requireOwner();
    if (!isMediaUploadConfigured()) return { ok: false, error: "Uploads are not configured." };

    const orphans = await findOrphans();
    let deleted = 0;
    let failed = 0;

    for (const media of orphans) {
      try {
        // Skipped, not failed, if a draft started using it since the list was made.
        if ((await removeIfUnused(media)).length === 0) deleted += 1;
      } catch (error) {
        /* One unreachable object must not strand the rest of the sweep, and the
           row is deliberately left in place so the next run tries it again. */
        console.error(`Could not remove the unused upload ${media.key}`, error);
        failed += 1;
      }
    }

    return { ok: true, deleted, failed };
  } catch {
    return { ok: false, error: "Could not remove the unused uploads." };
  }
}
