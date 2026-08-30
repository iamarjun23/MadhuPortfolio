import { MediaKind } from "@/generated/prisma";

export type UploadEndpoint =
  | "heroVideo"
  | "portrait"
  | "boothImage"
  | "logoImage"
  | "roomImage"
  | "ogImage";

type EndpointConfig = Readonly<{
  kind: MediaKind;
  accept: "image/" | "video/";
  maxBytes: number;
}>;

const MB = 1024 * 1024;

export const uploadEndpoints: Record<UploadEndpoint, EndpointConfig> = {
  heroVideo: { kind: MediaKind.VIDEO, accept: "video/", maxBytes: 32 * MB },
  portrait: { kind: MediaKind.IMAGE, accept: "image/", maxBytes: 4 * MB },
  boothImage: { kind: MediaKind.IMAGE, accept: "image/", maxBytes: 4 * MB },
  logoImage: { kind: MediaKind.IMAGE, accept: "image/", maxBytes: 4 * MB },
  roomImage: { kind: MediaKind.IMAGE, accept: "image/", maxBytes: 4 * MB },
  ogImage: { kind: MediaKind.IMAGE, accept: "image/", maxBytes: 4 * MB },
};

export function isUploadEndpoint(value: string): value is UploadEndpoint {
  return value in uploadEndpoints;
}
