"use client";

import { ExternalLink, FileText, RefreshCw, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { deleteMediaByUrl } from "@/actions/media";
import { MediaPreview } from "@/components/studio/MediaPreview";
import { useMediaUpload } from "@/lib/media-upload-client";
import { acceptAttribute, endpointLimits, isAllowedMimeType } from "@/lib/upload-endpoints";
import { isPlaceholderImageSrc } from "@/lib/placeholders";
import type { UploadEndpoint } from "@/lib/media-upload";

export type { UploadEndpoint };

type UploadResult = Readonly<{ id: string; url: string }>;

type DropzoneProps = Readonly<{
  endpoint: UploadEndpoint;
  /** Names this upload in the studio-wide "still uploading" messages. */
  label: string;
  value?: string;
  enabled: boolean;
  onUploaded: (upload: UploadResult) => void;
  /** Takes the file off the page. The stored file goes only when the editor asks for that. */
  onRemoved: () => void;
}>;

const kinds = {
  "image/": { noun: "photo", types: "JPG, PNG, WebP, AVIF or GIF" },
  "video/": { noun: "video", types: "MP4, WebM or MOV" },
  "application/": { noun: "PDF", types: "PDF" },
} as const;

/* One upload slot, drawn as whichever single state it is in - empty, uploading,
   refused, or holding a file - so there is only ever one obvious thing to do. */
export function Dropzone({
  endpoint,
  label,
  value,
  enabled,
  onUploaded,
  onRemoved,
}: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadingName, setUploadingName] = useState("");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string>();
  const [failedPreviewUrl, setFailedPreviewUrl] = useState<string>();
  const [isDragging, setIsDragging] = useState(false);
  /* Both are held against the address they were raised for, so a new file - or
     Undo putting the old one back - starts the slot afresh without an effect. */
  const [confirmingUrl, setConfirmingUrl] = useState<string>();
  const [deleteFailure, setDeleteFailure] = useState<Readonly<{ url: string; message: string }>>();
  const [isDeleting, setIsDeleting] = useState(false);
  const { startUpload, cancelUpload, isUploading, isBlockedByOtherUpload, blockingUploadLabel } =
    useMediaUpload(endpoint, label);

  /* Read from the shared table rather than re-derived here. Checking for one
     endpoint by name missed `reelVideo`, so a work project's or pinboard card's
     video field behaved as an image field throughout. */
  const { accept: acceptKind, maxBytes } = endpointLimits[endpoint];
  const { noun, types } = kinds[acceptKind];
  const maxLabel = `${Math.round(maxBytes / (1024 * 1024))} MB`;

  // Records seeded before the placeholder artwork was retired still carry its
  // address. The page treats that as no picture at all, so the slot shows its
  // empty state rather than previewing a file the visitor never sees.
  const storedUrl = value && !isPlaceholderImageSrc(value) ? value : undefined;
  const isConfirming = Boolean(storedUrl) && confirmingUrl === storedUrl;
  const deleteError = deleteFailure?.url === storedUrl ? deleteFailure?.message : undefined;

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
      setError(`${file.name} is not a ${types} file.`);
      return;
    }
    if (file.size > maxBytes) {
      const size = (file.size / (1024 * 1024)).toFixed(1);
      setError(`${file.name} is ${size} MB. The limit is ${maxLabel}.`);
      return;
    }
    setUploadingName(file.name);
    setFailedPreviewUrl(undefined);
    setProgress(0);
    setError(undefined);

    try {
      const upload = await startUpload(file, setProgress);
      onUploaded({ id: upload.id, url: upload.url });
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Could not start the upload.");
    }
  };

  const deleteForever = async () => {
    if (!storedUrl || isDeleting) return;
    setIsDeleting(true);
    const result = await deleteMediaByUrl(storedUrl);
    setIsDeleting(false);
    if (!result.ok) {
      setDeleteFailure({ url: storedUrl, message: result.error });
      return;
    }
    onRemoved();
  };

  const openPicker = () => inputRef.current?.click();
  const isIdle = enabled && !isBlockedByOtherUpload;

  let body: React.ReactNode;

  if (isUploading) {
    body = (
      <div className="studio-drop__progress" role="status" aria-live="polite">
        <p>
          <span>{uploadingName}</span>
          <b>{progress}%</b>
        </p>
        <div className="studio-drop__bar">
          <i style={{ width: `${progress}%` }} />
        </div>
        <button className="studio-ins-btn" type="button" onClick={cancelUpload}>
          Cancel upload
        </button>
      </div>
    );
  } else if (error) {
    body = (
      <div className="studio-drop__zone studio-drop__zone--error" role="alert">
        <p>{error}</p>
        <div className="studio-drop__actions">
          <button className="studio-ins-btn" type="button" onClick={openPicker}>
            Choose another file
          </button>
          <button
            className="studio-ins-btn studio-ins-btn--quiet"
            type="button"
            onClick={() => setError(undefined)}
          >
            {storedUrl ? `Keep the current ${noun}` : "Cancel"}
          </button>
        </div>
      </div>
    );
  } else if (storedUrl) {
    body = (
      <>
        {acceptKind === "application/" ? (
          <a className="studio-drop__file" href={storedUrl} target="_blank" rel="noreferrer">
            <FileText aria-hidden="true" />
            <span>Open the PDF</span>
            <ExternalLink aria-hidden="true" />
          </a>
        ) : failedPreviewUrl === storedUrl ? (
          <p className="studio-drop__file" role="status">
            This {noun} could not be shown. Replace it, or check its address under More options.
          </p>
        ) : (
          <MediaPreview
            label={label}
            source={
              acceptKind === "video/"
                ? { kind: "video", src: storedUrl }
                : { kind: "image", src: storedUrl, alt: `Current ${noun}` }
            }
            onError={() => setFailedPreviewUrl(storedUrl)}
          />
        )}
        {isConfirming ? (
          <div className="studio-drop__confirm">
            <p>Remove this {noun}?</p>
            <div className="studio-drop__actions">
              <button className="studio-ins-btn" type="button" onClick={onRemoved}>
                Remove from page
              </button>
              <button
                className="studio-ins-btn studio-ins-btn--danger"
                type="button"
                disabled={isDeleting}
                onClick={() => void deleteForever()}
              >
                {isDeleting ? "Deleting..." : "Delete forever"}
              </button>
            </div>
            {deleteError ? (
              <small className="studio-drop__warn" role="alert">
                {deleteError}
              </small>
            ) : (
              <small>
                Remove keeps the file, so Undo can bring it back. Delete forever cannot be undone.
              </small>
            )}
            <button
              className="studio-ins-btn studio-ins-btn--quiet"
              type="button"
              onClick={() => setConfirmingUrl(undefined)}
            >
              Keep it
            </button>
          </div>
        ) : (
          <div className="studio-drop__actions">
            <button
              className="studio-ins-btn"
              type="button"
              disabled={!isIdle}
              onClick={openPicker}
            >
              <RefreshCw aria-hidden="true" />
              Replace
            </button>
            <button
              className="studio-ins-btn"
              type="button"
              onClick={() => setConfirmingUrl(storedUrl)}
            >
              <Trash2 aria-hidden="true" />
              Remove
            </button>
          </div>
        )}
      </>
    );
  } else {
    body = (
      <div
        className={`studio-drop__zone${isDragging ? " is-dragging" : ""}`}
        onDragEnter={() => setIsDragging(true)}
        onDragLeave={() => setIsDragging(false)}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          void chooseFile(event.dataTransfer.files[0]);
        }}
      >
        <Upload aria-hidden="true" />
        <p>
          {!enabled
            ? "Uploads are not set up yet"
            : isBlockedByOtherUpload
              ? `Waiting for ${blockingUploadLabel ?? "another upload"} to finish`
              : `Drop a ${noun} here, or`}
        </p>
        <button className="studio-ins-btn" type="button" disabled={!isIdle} onClick={openPicker}>
          Choose file
        </button>
      </div>
    );
  }

  return (
    <div className="studio-drop">
      <input
        ref={inputRef}
        type="file"
        hidden
        accept={acceptAttribute[acceptKind]}
        onChange={(event) => {
          void chooseFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      {body}
      <p className="studio-drop__limit">
        {types} · up to {maxLabel}
      </p>
    </div>
  );
}
