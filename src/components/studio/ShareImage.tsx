"use client";

import { useState } from "react";

/* The share image is whatever address was saved, and a chat app that cannot load
   it shows no picture at all - so say that here rather than draw a broken image. */
export function ShareImage({ url }: Readonly<{ url: string }>) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <span className="studio-settings__share-empty">The share image did not load</span>;
  }

  return (
    // An address the owner uploaded to, so it cannot go through next/image.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      onError={() => setFailed(true)}
      // A load that failed before this hydrated never reaches onError.
      ref={(image) => {
        if (image?.complete && image.naturalWidth === 0) setFailed(true);
      }}
    />
  );
}
