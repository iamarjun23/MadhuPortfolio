"use client";

import { useCallback, useState } from "react";
import type { UploadEndpoint } from "@/lib/media-upload";

export type MediaUploadResult = Readonly<{
  id: string;
  url: string;
  key: string;
  width: number | null;
  height: number | null;
}>;

export function useMediaUpload(endpoint: UploadEndpoint) {
  const [isUploading, setIsUploading] = useState(false);

  const startUpload = useCallback(
    (file: File, onProgress?: (percent: number) => void) =>
      new Promise<MediaUploadResult>((resolve, reject) => {
        setIsUploading(true);
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `/api/upload/${endpoint}`);
        xhr.setRequestHeader("Content-Type", file.type);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100));
        };

        xhr.onload = () => {
          setIsUploading(false);
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
          setIsUploading(false);
          reject(new Error("Upload failed."));
        };

        xhr.send(file);
      }),
    [endpoint],
  );

  return { startUpload, isUploading };
}
