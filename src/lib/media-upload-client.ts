"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createUpload, finishUpload } from "@/actions/media";
import type { MediaUploadResult } from "@/actions/media-types";
import { useStudioStore } from "@/stores/studio-store";
import type { UploadEndpoint } from "@/lib/media-upload";

/* A hung socket never fires load or error, so without this the studio-wide lock
   would stay held for the rest of the session and every other control would sit
   disabled behind an upload that was never going to finish. Generous on purpose:
   it is a floor under a dead connection, not a speed requirement - a 64MB video
   has to survive a slow line. */
const UPLOAD_TIMEOUT_MS = 30 * 60 * 1000;

/* Stored on the object and served back by R2's custom domain. Keys are random
   and never reused for different content, so a year-long immutable lifetime is safe. */
const CACHE_CONTROL = "public, max-age=31536000, immutable";

// XHR rather than fetch: fetch still reports no upload progress.
function putFile(
  xhr: XMLHttpRequest,
  uploadUrl: string,
  file: File,
  onProgress?: (percent: number) => void,
) {
  return new Promise<void>((resolve, reject) => {
    xhr.timeout = UPLOAD_TIMEOUT_MS;
    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.setRequestHeader("Cache-Control", CACHE_CONTROL);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("Upload failed."));
    xhr.onerror = () => reject(new Error("Upload failed."));
    xhr.ontimeout = () =>
      reject(new Error("The upload timed out. Check your connection and try again."));
    xhr.onabort = () => reject(new Error("Upload cancelled."));

    xhr.send(file);
  });
}

export function useMediaUpload(endpoint: UploadEndpoint, label: string) {
  const [isUploading, setIsUploading] = useState(false);
  const activeUpload = useStudioStore((state) => state.activeUpload);
  const request = useRef<XMLHttpRequest | null>(null);
  const token = useRef<number | null>(null);

  const release = useCallback(() => {
    if (token.current !== null) {
      useStudioStore.getState().endUpload(token.current);
      token.current = null;
    }
    request.current = null;
    setIsUploading(false);
  }, []);

  /* Navigating away mid-upload used to leave the request running with nobody to
     receive its result: the file still reached R2 and still got a media row, but
     the editor that would have written its URL into the draft was gone, so the row
     was orphaned. Aborting also hands back the lock, which would otherwise be held
     by a component that no longer exists. */
  useEffect(
    () => () => {
      request.current?.abort();
      if (token.current !== null) useStudioStore.getState().endUpload(token.current);
      token.current = null;
    },
    [],
  );

  const startUpload = useCallback(
    async (file: File, onProgress?: (percent: number) => void): Promise<MediaUploadResult> => {
      const acquired = useStudioStore.getState().beginUpload(label);
      if (acquired === null) {
        const holder = useStudioStore.getState().activeUpload?.label;
        throw new Error(
          holder
            ? `${holder} is still uploading. Wait for it to finish, then try again.`
            : "Another upload is already running.",
        );
      }

      token.current = acquired;
      setIsUploading(true);

      try {
        const upload = await createUpload(endpoint, file.type, file.size);
        if (!upload.ok) throw new Error(upload.error);
        // Unmounted while the URL was being signed: nobody is left to use the file.
        if (token.current !== acquired) throw new Error("Upload cancelled.");

        const xhr = new XMLHttpRequest();
        request.current = xhr;
        await putFile(xhr, upload.uploadUrl, file, onProgress);

        const finished = await finishUpload(upload.key);
        if (!finished.ok) throw new Error(finished.error);
        return finished.media;
      } finally {
        release();
      }
    },
    [endpoint, label, release],
  );

  const cancelUpload = useCallback(() => request.current?.abort(), []);

  return {
    startUpload,
    cancelUpload,
    isUploading,
    /* Another dropzone holds the lock: this one has to wait rather than queue a
       second request behind it. Derived from `isUploading` rather than the token
       ref because a ref read during render would not re-run when the lock moves. */
    isBlockedByOtherUpload: Boolean(activeUpload) && !isUploading,
    blockingUploadLabel: isUploading ? null : (activeUpload?.label ?? null),
  };
}
