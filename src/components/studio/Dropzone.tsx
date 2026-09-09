"use client";

import { useEffect, useId, useState } from "react";
import { deleteMedia } from "@/actions/media";
import { MediaPreview } from "@/components/studio/MediaPreview";
import { useMediaUpload } from "@/lib/media-upload-client";
import { acceptAttribute, endpointLimits, isAllowedMimeType } from "@/lib/upload-endpoints";
import { isPlaceholderImageSrc } from "@/lib/placeholders";
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
  const [failedPreviewUrl, setFailedPreviewUrl] = useState<string>();
  const [uploadedId, setUploadedId] = useState<string>();
  const [isDragging, setIsDragging] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { startUpload, cancelUpload, isUploading, isBlockedByOtherUpload, blockingUploadLabel } =
    useMediaUpload(endpoint, label);
  const busy = isUploading || isBlockedByOtherUpload;

  /* Read from the shared table rather than re-derived here. Checking for one
     endpoint by name missed `reelVideo`, so a work project's or pinboard card's
     video field behaved as an image field throughout. */
  const { accept: acceptKind, maxBytes } = endpointLimits[endpoint];
  const isVideo = acceptKind === "video/";
  const maxLabel = `${Math.round(maxBytes / (1024 * 1024))} MB`;
  const fileHint = isVideo ? `Video up to ${maxLabel}` : `Image up to ${maxLabel}`;

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  const chooseFile = async (file: File | undefined) => {
    if (!file || !enabled || isUploading) return;
    /* A drop lands here even while another field is uploading, so the refusal has
       to be explained rather than silently ignored - the file simply vanishing
       looked like the dropzone was broken. */
    if (isBlockedByOtherUpload) {
      setError(
        blockingUploadLabel
          ? `${blockingUploadLabel} is still uploading. Wait for it to finish, then add this one.`
          : "Another upload is still running. Wait for it to finish, then add this one.",
      );
      return;
    }
    if (!isAllowedMimeType(file.type, acceptKind)) {
      setError(
        isVideo
          ? "Choose an MP4, WebM or MOV video."
          : "Choose a JPEG, PNG, WebP, AVIF or GIF image.",
      );
      return;
    }
    if (file.size > maxBytes) {
      setError(`${file.name} is larger than the ${maxLabel} limit.`);
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setPreviewIsVideo(file.type.startsWith("video/"));
    setFailedPreviewUrl(undefined);
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
    if (!uploadedId || isDeleting || busy) return;
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

  const accept = acceptAttribute[acceptKind];
  // Records seeded before the placeholder artwork was retired still carry its
  // address. The page treats that as no picture at all, so the field here shows
  // its empty state rather than previewing a file the visitor never sees.
  const storedUrl = value && !isPlaceholderImageSrc(value) ? value : undefined;
  const displayUrl = previewUrl ?? storedUrl;
  const displayIsVideo = previewUrl ? previewIsVideo : isVideo;
  const previewFailed = failedPreviewUrl === displayUrl;

  const handlePreviewError = () => {
    setFailedPreviewUrl(displayUrl);
    setError(
      `This ${displayIsVideo ? "video" : "image"} could not be displayed. Choose another file or check the media URL.`,
    );
  };

  return (
    <div className="studio-dropzone">
      <label
        className={`studio-dropzone__target${isDragging ? " is-dragging" : ""}${
          !enabled || busy ? " is-disabled" : ""
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
          disabled={!enabled || busy}
          onChange={(event) => {
            void chooseFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
        <span>{label}</span>
        <small>
          {!enabled
            ? "Uploads are not configured"
            : isUploading
              ? "Uploading - this file has to finish first"
              : isBlockedByOtherUpload
                ? `Waiting for ${blockingUploadLabel ?? "another upload"} to finish`
                : `${fileHint} · Drop a file or choose one`}
        </small>
      </label>
      {displayUrl ? (
        <div className="studio-dropzone__preview">
          {previewFailed ? (
            <p className="studio-dropzone__preview-fallback" role="status">
              {displayIsVideo ? "Video preview unavailable" : "Image preview unavailable"}
            </p>
          ) : (
            <MediaPreview
              label={label}
              source={
                displayIsVideo
                  ? { kind: "video", src: displayUrl }
                  : { kind: "image", src: displayUrl, alt: "Selected media preview" }
              }
              onError={handlePreviewError}
            />
          )}
        </div>
      ) : null}
      {isUploading ? (
        <p className="studio-dropzone__status" role="status" aria-live="polite">
          Uploading {progress}%
          <button className="studio-dropzone__cancel" type="button" onClick={cancelUpload}>
            Cancel
          </button>
        </p>
      ) : null}
      {uploadedId ? (
        <button
          className="studio-dropzone__delete"
          type="button"
          onClick={() => void removeUpload()}
          disabled={isDeleting || busy}
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
