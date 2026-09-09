"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useStudioStore } from "@/stores/studio-store";
import type { UploadEndpoint } from "@/lib/media-upload";

export type MediaUploadResult = Readonly<{
  id: string;
  url: string;
  key: string;
  width: number | null;
  height: number | null;
}>;

/* A hung socket never fires load or error, so without this the studio-wide lock
   would stay held for the rest of the session and every other control would sit
   disabled behind an upload that was never going to finish. Generous on purpose:
   it is a floor under a dead connection, not a speed requirement - a 64MB video
   has to survive a slow line. */
const UPLOAD_TIMEOUT_MS = 30 * 60 * 1000;

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
    },
    [],
  );

  const startUpload = useCallback(
    (file: File, onProgress?: (percent: number) => void) =>
      new Promise<MediaUploadResult>((resolve, reject) => {
        const acquired = useStudioStore.getState().beginUpload(label);
        if (acquired === null) {
          const holder = useStudioStore.getState().activeUpload?.label;
          reject(
            new Error(
              holder
                ? `${holder} is still uploading. Wait for it to finish, then try again.`
                : "Another upload is already running.",
            ),
          );
          return;
        }

        token.current = acquired;
        setIsUploading(true);
        const xhr = new XMLHttpRequest();
        request.current = xhr;
        xhr.timeout = UPLOAD_TIMEOUT_MS;
        xhr.open("POST", `/api/upload/${endpoint}`);
        xhr.setRequestHeader("Content-Type", file.type);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100));
        };

        xhr.onload = () => {
          release();
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText) as MediaUploadResult);
            } catch {
              reject(new Error("Could not parse the upload response."));
            }
            return;
          }
          try {
            const body = JSON.parse(xhr.responseText) as { error?: string };
            reject(new Error(body.error ?? "Upload failed."));
          } catch {
            reject(new Error("Upload failed."));
          }
        };

        xhr.onerror = () => {
          release();
          reject(new Error("Upload failed."));
        };

        xhr.ontimeout = () => {
          release();
          reject(new Error("The upload timed out. Check your connection and try again."));
        };

        xhr.onabort = () => {
          release();
          reject(new Error("Upload cancelled."));
        };

        xhr.send(file);
      }),
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
