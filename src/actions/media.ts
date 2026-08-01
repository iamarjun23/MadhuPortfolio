"use server";

import { requireOwner } from "@/auth";
import { getDb } from "@/lib/db";
import { isUploadThingConfigured } from "@/lib/uploadthing-config";
import { UTApi } from "uploadthing/server";

type DeleteMediaResult = Readonly<{ ok: true }> | Readonly<{ ok: false; error: string }>;

export async function deleteMedia(mediaId: string): Promise<DeleteMediaResult> {
  try {
    await requireOwner();
    const media = await getDb().media.findUnique({ where: { id: mediaId } });

    if (!media) return { ok: false, error: "This upload no longer exists." };
    if (!isUploadThingConfigured()) return { ok: false, error: "Uploads are not configured." };

    await new UTApi().deleteFiles(media.key);
    await getDb().media.delete({ where: { id: media.id } });
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not delete this upload. Please try again." };
  }
}
