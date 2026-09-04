"use client";

/* Dynamic object URLs and uploaded media URLs cannot use Next's static image optimization. */
/* eslint-disable @next/next/no-img-element */

import { useEffect, useId, useState } from "react";
import { deleteMedia } from "@/actions/media";
import { useMediaUpload } from "@/lib/media-upload-client";
import type { UploadEndpoint } from "@/lib/media-upload";

export type { UploadEndpoint };

type UploadResult = Readonly<{ id: string; url: string }>;

type DropzoneProps = Readonly<{
  endpoint: UploadEndpoint;
  label: string;
  value?: string;
  enabled: boolean;
  onUploaded: (upload: UploadResult) => void;
  onDeleted: () => void;
}>;

export function Dropzone({
  endpoint,
  label,
  value,
  enabled,
  onUploaded,
  onDeleted,
}: DropzoneProps) {
  const inputId = useId();
  const [previewUrl, setPreviewUrl] = useState<string>();
  const [previewIsVideo, setPreviewIsVideo] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string>();
  const [uploadedId, setUploadedId] = useState<string>();
  const [isDragging, setIsDragging] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { startUpload, isUploading } = useMediaUpload(endpoint);

  const isVideo = endpoint === "heroVideo";
  const maxBytes = (isVideo ? 32 : 4) * 1024 * 1024;
  const fileHint = isVideo ? "Video up to 32 MB" : "Image up to 4 MB";

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  const chooseFile = async (file: File | undefined) => {
    if (!file || !enabled || isUploading) return;
    if (!file.type.startsWith(isVideo ? "video/" : "image/")) {
      setError(`Choose an ${isVideo ? "video" : "image"} file.`);
      return;
    }
    if (file.size > maxBytes) {
      setError(`${file.name} is larger than the ${isVideo ? "32" : "4"} MB limit.`);
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setPreviewIsVideo(file.type.startsWith("video/"));
    setProgress(0);
    setError(undefined);
    setUploadedId(undefined);

    try {
      const upload = await startUpload(file, setProgress);
      setProgress(100);
      setUploadedId(upload.id);
      onUploaded({ id: upload.id, url: upload.url });
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Could not start the upload.");
    }
  };

  const removeUpload = async () => {
    if (!uploadedId || isDeleting) return;
    setIsDeleting(true);
    const result = await deleteMedia(uploadedId);
    if (!result.ok) {
      setError(result.error);
      setIsDeleting(false);
      return;
    }
    setUploadedId(undefined);
    setPreviewUrl(undefined);
    onDeleted();
    setIsDeleting(false);
  };

  const accept = isVideo ? "video/*" : "image/*";
  const displayUrl = previewUrl ?? value;

  return (
    <div className="studio-dropzone">
      <label
        className={`studio-dropzone__target${isDragging ? " is-dragging" : ""}${
          !enabled ? " is-disabled" : ""
        }`}
        htmlFor={inputId}
        onDragEnter={() => setIsDragging(true)}
        onDragLeave={() => setIsDragging(false)}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          void chooseFile(event.dataTransfer.files[0]);
        }}
      >
        <input
          id={inputId}
          type="file"
          accept={accept}
          disabled={!enabled || isUploading}
          onChange={(event) => {
            void chooseFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
        <span>{label}</span>
        <small>
          {enabled ? `${fileHint} · Drop a file or choose one` : "Uploads are not configured"}
        </small>
      </label>
      {displayUrl ? (
        <div className="studio-dropzone__preview">
          {previewIsVideo || endpoint === "heroVideo" ? (
            <video controls muted src={displayUrl} />
          ) : (
            <img src={displayUrl} alt="Selected media preview" />
          )}
        </div>
      ) : null}
      {isUploading ? (
        <p className="studio-dropzone__status" role="status" aria-live="polite">
          Uploading {progress}%
        </p>
      ) : null}
      {uploadedId ? (
        <button
          className="studio-dropzone__delete"
          type="button"
          onClick={() => void removeUpload()}
          disabled={isDeleting}
        >
          {isDeleting ? "Deleting..." : "Delete uploaded file"}
        </button>
      ) : null}
      {error ? (
        <p className="studio-dropzone__error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
