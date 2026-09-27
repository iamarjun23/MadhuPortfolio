"use client";

import { useState } from "react";
import { preconnect } from "react-dom";
import { MediaImage } from "@/components/public/MediaImage";
import { loaderSourceUrl } from "@/lib/media-src";
import { PHOTO_VIEWER_SIZES } from "@/lib/preload-image";
import { EMBED_SANDBOX } from "@/lib/reel";

type ReelEmbedProps = Readonly<{
  src: string;
  title: string;
  allow: string;
  // The card's own still. Pass the card's `sizes` so the browser reuses the copy the
  // board already downloaded and the still shows the instant the viewer opens.
  still: string | null;
  stillSizes: string;
}>;

/** Opens the connections to the embed hosts ahead of a click, so a player boots sooner.
    Called while a board renders; React dedupes the hints. */
export function preconnectReelHosts() {
  for (const host of [
    "https://www.instagram.com",
    "https://www.linkedin.com",
    "https://www.youtube-nocookie.com",
  ]) {
    preconnect(host);
  }
}

/* A YouTube/Instagram/LinkedIn player takes a second or more to boot, and until it does
   the frame is an empty black box. The card's still sits there instead, with no spinner:
   first the small copy the board already has (instant), then - where the image loader can
   resize it - a frame-sized copy painted over it, and the player fades in over both once
   its page has loaded. */
export function ReelEmbed({ src, title, allow, still, stillSizes }: ReelEmbedProps) {
  const [loaded, setLoaded] = useState(false);
  const [stillFailed, setStillFailed] = useState(false);

  return (
    <>
      {still && !stillFailed ? (
        <MediaImage
          className="mood-player__still"
          src={still}
          alt=""
          fill
          sizes={stillSizes}
          onError={() => setStillFailed(true)}
        />
      ) : null}
      {still && !stillFailed && loaderSourceUrl(still) ? (
        <MediaImage
          className="mood-player__still"
          src={still}
          alt=""
          fill
          sizes={PHOTO_VIEWER_SIZES}
        />
      ) : null}
      <iframe
        className={loaded ? "is-loaded" : undefined}
        src={src}
        title={title}
        scrolling="no"
        allow={allow}
        sandbox={EMBED_SANDBOX}
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
        onLoad={() => setLoaded(true)}
      />
    </>
  );
}
