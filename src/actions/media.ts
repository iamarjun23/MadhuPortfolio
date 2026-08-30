"use server";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { requireOwner } from "@/auth";
import { getDb } from "@/lib/db";

type DeleteMediaResult = Readonly<{ ok: true }> | Readonly<{ ok: false; error: string }>;

export async function deleteMedia(mediaId: string): Promise<DeleteMediaResult> {
  try {
    await requireOwner();
    const media = await getDb().media.findUnique({ where: { id: mediaId } });

    if (!media) return { ok: false, error: "This upload no longer exists." };

    const { env } = await getCloudflareContext({ async: true });
    if (!env.MEDIA_BUCKET) return { ok: false, error: "Uploads are not configured." };

    await env.MEDIA_BUCKET.delete(media.key);
    await getDb().media.delete({ where: { id: media.id } });
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not delete this upload. Please try again." };
  }
}
