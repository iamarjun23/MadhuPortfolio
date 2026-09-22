import { MediaKind } from "@/generated/prisma/client";
import {
  type MediaAccept,
  type UploadEndpoint,
  endpointLimits,
  uploadEndpointNames,
} from "@/lib/upload-endpoints";

export { acceptAttribute, isAllowedMimeType, normalizeMimeType } from "@/lib/upload-endpoints";

export type { UploadEndpoint };

type EndpointConfig = Readonly<{
  kind: MediaKind;
  accept: MediaAccept;
  maxBytes: number;
}>;

export const uploadEndpoints: Record<UploadEndpoint, EndpointConfig> = {
  heroVideo: { kind: MediaKind.VIDEO, ...endpointLimits.heroVideo },
  portrait: { kind: MediaKind.IMAGE, ...endpointLimits.portrait },
  experienceImage: { kind: MediaKind.IMAGE, ...endpointLimits.experienceImage },
  roomImage: { kind: MediaKind.IMAGE, ...endpointLimits.roomImage },
  collaboratorImage: { kind: MediaKind.IMAGE, ...endpointLimits.collaboratorImage },
  clientLogo: { kind: MediaKind.IMAGE, ...endpointLimits.clientLogo },
  testimonialImage: { kind: MediaKind.IMAGE, ...endpointLimits.testimonialImage },
  // A reel uploaded to a work project or a pinboard card, rather than linked.
  reelVideo: { kind: MediaKind.VIDEO, ...endpointLimits.reelVideo },
  // The still shown on a reel card when its link brings none of its own.
  reelCover: { kind: MediaKind.IMAGE, ...endpointLimits.reelCover },
  ogImage: { kind: MediaKind.IMAGE, ...endpointLimits.ogImage },
  // The owner's stand-in picture, shown wherever a photo has not been set.
  fallbackImage: { kind: MediaKind.IMAGE, ...endpointLimits.fallbackImage },
  resumeFile: { kind: MediaKind.DOCUMENT, ...endpointLimits.resumeFile },
};

export function isUploadEndpoint(value: string): value is UploadEndpoint {
  return (uploadEndpointNames as readonly string[]).includes(value);
}
