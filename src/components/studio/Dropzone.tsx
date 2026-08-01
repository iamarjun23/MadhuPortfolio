"use client";

/* Dynamic object URLs and UploadThing URLs cannot use Next's static image optimization. */
/* eslint-disable @next/next/no-img-element */

import { useEffect, useId, useState } from "react";
import { deleteMedia } from "@/actions/media";
import { useUploadThing } from "@/lib/uploadthing-client";

export type UploadEndpoint =
  "heroVideo" | "portrait" | "boothImage" | "logoImage" | "roomImage" | "ogImage";

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
  const { startUpload, isUploading } = useUploadThing(endpoint, {
    onClientUploadComplete: (files) => {
      const upload = files[0]?.serverData;
      if (!upload) {
        setError("The upload finished without a media record.");
        return;
      }
      setProgress(100);
      setUploadedId(upload.id);
      onUploaded({ id: upload.id, url: upload.url });
    },
    onUploadError: (uploadError) => setError(uploadError.message),
    onUploadProgress: setProgress,
  });

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  const chooseFile = async (file: File | undefined) => {
    if (!file || !enabled || isUploading) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setPreviewIsVideo(file.type.startsWith("video/"));
    setProgress(0);
    setError(undefined);
    setUploadedId(undefined);

    try {
      await startUpload([file]);
    } catch {
      setError("Could not start the upload. Check your UploadThing configuration.");
    }
  };

  const removeUpload = async () => {
    if (!uploadedId) return;
    const result = await deleteMedia(uploadedId);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setUploadedId(undefined);
    setPreviewUrl(undefined);
    onDeleted();
  };

  const accept = endpoint === "heroVideo" ? "video/*" : "image/*";
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
          onChange={(event) => void chooseFile(event.target.files?.[0])}
        />
        <span>{label}</span>
        <small>
          {enabled ? "Drop a file or choose one" : "Add UPLOADTHING_TOKEN to enable uploads"}
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
      {isUploading ? <p className="studio-dropzone__status">Uploading {progress}%</p> : null}
      {uploadedId ? (
        <button
          className="studio-dropzone__delete"
          type="button"
          onClick={() => void removeUpload()}
        >
          Delete uploaded file
        </button>
      ) : null}
      {error ? <p className="studio-dropzone__error">{error}</p> : null}
    </div>
  );
}
