"use server";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { requireOwner } from "@/auth";
import { getDb } from "@/lib/db";
import { describePlaces, getMediaUsage, getMediaUsageForUrl } from "@/lib/media-usage";
import type { DeleteMediaResult, PurgeMediaResult, UnusedMediaResult } from "@/actions/media-types";

/* An upload only reaches a section when the draft holding it is saved, so a file
   that has just been added is legitimately unreferenced for as long as the editor
   sits open. Sweeping those away would delete the file out from under whoever is
   still working on it, so only uploads old enough to have been abandoned count. */
const ORPHAN_GRACE_MS = 24 * 60 * 60 * 1000;

export async function deleteMedia(mediaId: string): Promise<DeleteMediaResult> {
  try {
    await requireOwner();
    const media = await getDb().media.findUnique({ where: { id: mediaId } });

    if (!media) return { ok: false, error: "This upload no longer exists." };

    /* Deleting a file a section still points at leaves a broken image behind -
       on the live site, if the published row is one of the places using it. The
       reference has to be cleared in the editor first. */
    const places = await getMediaUsageForUrl(media.url);
    if (places && places.length > 0) {
      return {
        ok: false,
        error: `Still used by ${describePlaces(places)}. Remove it there first, then delete the file.`,
      };
    }

    const { env } = await getCloudflareContext({ async: true });
    if (!env.MEDIA_BUCKET) return { ok: false, error: "Uploads are not configured." };

    await env.MEDIA_BUCKET.delete(media.key);
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
    select: { id: true, key: true, url: true, bytes: true },
  });
  return candidates.filter((media) => !usage.has(media.url));
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
    const { env } = await getCloudflareContext({ async: true });
    if (!env.MEDIA_BUCKET) return { ok: false, error: "Uploads are not configured." };

    const orphans = await findOrphans();
    let deleted = 0;
    let failed = 0;

    for (const media of orphans) {
      try {
        await env.MEDIA_BUCKET.delete(media.key);
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
