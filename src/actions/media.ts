"use server";

import { randomUUID } from "node:crypto";
import { requireOwner } from "@/auth";
import { getDb } from "@/lib/db";
import {
  deleteObject,
  headObject,
  isMediaUploadConfigured,
  mediaPublicUrl,
  signUpload,
} from "@/lib/media-config";
import {
  type UploadEndpoint,
  isAllowedMimeType,
  isUploadEndpoint,
  normalizeMimeType,
  uploadEndpoints,
} from "@/lib/media-upload";
import { describePlaces, getMediaUsage, getMediaUsageForKey } from "@/lib/media-usage";
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

function describeLimits(endpoint: UploadEndpoint) {
  const { accept, maxBytes } = uploadEndpoints[endpoint];
  const kinds =
    accept === "image/" ? "a JPEG, PNG, WebP, AVIF or GIF image" : "an MP4, WebM or MOV video";
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

// ponytail: an upload abandoned between its PUT and this call leaves an R2 object with no media row,
// which the unused-media sweep cannot see. Add an R2 lifecycle rule or a bucket listing if it adds up.
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

  try {
    const stored = await headObject(key);
    if (!stored.ok) return { ok: false, error: "The file did not reach storage. Please try again." };

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

    const media = await getDb().media.create({
      data: { key, url: mediaPublicUrl(key), kind: config.kind, bytes, mime },
    });
    return {
      ok: true,
      media: {
        id: media.id,
        url: media.url,
        key: media.key,
        width: media.width,
        height: media.height,
      },
    };
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

    /* Deleting a file a section still points at leaves a broken image behind -
       on the live site, if the published row is one of the places using it. The
       reference has to be cleared in the editor first. */
    const places = await getMediaUsageForKey(media.key);
    if (places.length > 0) {
      return {
        ok: false,
        error: `Still used by ${describePlaces(places)}. Remove it there first, then delete the file.`,
      };
    }

    if (!isMediaUploadConfigured()) return { ok: false, error: "Uploads are not configured." };

    await deleteObject(media.key);
    await getDb().media.delete({ where: { id: media.id } });
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not delete this upload. Please try again." };
  }
}

async function findOrphans() {
  const usage = await getMediaUsage();
  const candidates = await getDb().media.findMany({
    where: { createdAt: { lt: new Date(Date.now() - ORPHAN_GRACE_MS) } },
    select: { id: true, key: true, bytes: true },
  });
  return candidates.filter((media) => !usage.has(media.key));
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
        await deleteObject(media.key);
        await getDb().media.delete({ where: { id: media.id } });
        deleted += 1;
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
