import { MediaKind } from "@/generated/prisma";
import { requireOwner } from "@/auth";
import { getDb } from "@/lib/db";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

async function requireUploadOwner() {
  try {
    const user = await requireOwner();
    return { userId: user.id };
  } catch {
    throw new UploadThingError("Unauthorized");
  }
}

async function recordUpload(
  file: Readonly<{ key: string; name: string; size: number; type: string; ufsUrl: string }>,
  kind: MediaKind,
) {
  const media = await getDb().media.create({
    data: {
      key: file.key,
      url: file.ufsUrl,
      kind,
      bytes: file.size,
      mime: file.type,
      alt: file.name,
    },
  });

  return { id: media.id, url: media.url, key: media.key, width: media.width, height: media.height };
}

export const ourFileRouter = {
  heroVideo: f({ video: { maxFileSize: "32MB" } })
    .middleware(requireUploadOwner)
    .onUploadComplete(({ file }) => recordUpload(file, MediaKind.VIDEO)),
  portrait: f({ image: { maxFileSize: "4MB" } })
    .middleware(requireUploadOwner)
    .onUploadComplete(({ file }) => recordUpload(file, MediaKind.IMAGE)),
  boothImage: f({ image: { maxFileSize: "4MB" } })
    .middleware(requireUploadOwner)
    .onUploadComplete(({ file }) => recordUpload(file, MediaKind.IMAGE)),
  logoImage: f({ image: { maxFileSize: "4MB" } })
    .middleware(requireUploadOwner)
    .onUploadComplete(({ file }) => recordUpload(file, MediaKind.IMAGE)),
  roomImage: f({ image: { maxFileSize: "4MB" } })
    .middleware(requireUploadOwner)
    .onUploadComplete(({ file }) => recordUpload(file, MediaKind.IMAGE)),
  ogImage: f({ image: { maxFileSize: "4MB" } })
    .middleware(requireUploadOwner)
    .onUploadComplete(({ file }) => recordUpload(file, MediaKind.IMAGE)),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
