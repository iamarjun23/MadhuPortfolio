import { MediaKind } from "@/generated/prisma/client";

export type UploadEndpoint =
  | "heroVideo"
  | "portrait"
  | "boothImage"
  | "logoImage"
  | "praiseImage"
  | "experienceImage"
  | "impactImage"
  | "roomImage"
  | "reelVideo"
  | "reelCover"
  | "ogImage";

type EndpointConfig = Readonly<{
  kind: MediaKind;
  accept: "image/" | "video/";
  maxBytes: number;
}>;

const MB = 1024 * 1024;

export const uploadEndpoints: Record<UploadEndpoint, EndpointConfig> = {
  heroVideo: { kind: MediaKind.VIDEO, accept: "video/", maxBytes: 64 * MB },
  portrait: { kind: MediaKind.IMAGE, accept: "image/", maxBytes: 4 * MB },
  boothImage: { kind: MediaKind.IMAGE, accept: "image/", maxBytes: 4 * MB },
  logoImage: { kind: MediaKind.IMAGE, accept: "image/", maxBytes: 4 * MB },
  praiseImage: { kind: MediaKind.IMAGE, accept: "image/", maxBytes: 4 * MB },
  experienceImage: { kind: MediaKind.IMAGE, accept: "image/", maxBytes: 4 * MB },
  impactImage: { kind: MediaKind.IMAGE, accept: "image/", maxBytes: 4 * MB },
  roomImage: { kind: MediaKind.IMAGE, accept: "image/", maxBytes: 4 * MB },
  // A reel uploaded to a work project or a pinboard card, rather than linked.
  reelVideo: { kind: MediaKind.VIDEO, accept: "video/", maxBytes: 64 * MB },
  // The still shown on a reel card when its link brings none of its own.
  reelCover: { kind: MediaKind.IMAGE, accept: "image/", maxBytes: 4 * MB },
  ogImage: { kind: MediaKind.IMAGE, accept: "image/", maxBytes: 4 * MB },
};

export function isUploadEndpoint(value: string): value is UploadEndpoint {
  return value in uploadEndpoints;
}
