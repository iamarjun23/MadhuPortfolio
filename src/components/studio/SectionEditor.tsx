"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useCallback, useDeferredValue, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { saveDraft } from "@/actions/save-draft";
import { Dropzone, type UploadEndpoint } from "@/components/studio/Dropzone";
import { SaveBar } from "@/components/studio/SaveBar";
import { SettingsDangerZone } from "@/components/studio/SettingsDangerZone";
import { StudioLandingPreview } from "@/components/studio/StudioLandingPreview";
import type { SectionKey } from "@/lib/sections";
import {
  describeField,
  fieldLabel,
  mediaSpecs,
  sectionDocs,
  type MediaKindLabel,
} from "@/lib/studio-labels";
import { studioSectionLabels } from "@/lib/studio-nav";
import { getYouTubeId, getYouTubeThumbnail } from "@/lib/youtube";
import { useStudioStore } from "@/stores/studio-store";

type EditorValue = string | number | boolean | null | EditorObject | EditorValue[];
type EditorObject = { [key: string]: EditorValue };

const selectOptions: Record<string, readonly string[]> = {
  defaultTheme: ["suite", "sheet", "system"],
  hrefLabel: ["", "YouTube", "LinkedIn"],
  logoHint: ["l-jar", "l-onep", "l-ulc", "l-hb", "custom"],
  pinType: ["pin", "pin-signal", "tape", "none"],
  thumbHint: ["bd-1", "bd-2", "bd-3", "bd-4"],
  tile: ["a", "b", "c", "d", "e", "f", "g", "h"],
  tint: ["default", "ember", "signal", "rg1", "rg2", "rg3", "rg4", "rg5", "rg6"],
  type: ["polaroid", "note", "quote", "ig", "tags"],
  color: ["ember", "signal"],
};

function isEditorObject(value: EditorValue): value is EditorObject {
  return !Array.isArray(value) && value !== null && typeof value === "object";
}

function normalize(value: unknown): EditorValue {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  if (Array.isArray(value)) return value.map(normalize);
  if (typeof value === "object") {
    const result: EditorObject = {};
    for (const [key, entry] of Object.entries(value)) result[key] = normalize(entry);
    return result;
  }
  throw new Error("Studio data must be an object.");
}

function normalizeObject(value: unknown): EditorObject {
  const normalized = normalize(value);
  if (!isEditorObject(normalized)) throw new Error("Studio sections must contain an object.");
  return normalized;
}

function updateAtPath(
  data: EditorObject,
  path: readonly (string | number)[],
  nextValue: EditorValue,
): EditorObject {
  const [head, ...tail] = path;
  if (head === undefined) return data;
  const current = data[head];

  if (tail.length === 0) return { ...data, [head]: nextValue };

  if (typeof tail[0] === "number") {
    const list = Array.isArray(current) ? [...current] : [];
    const index = tail[0];
    if (tail.length === 1)
      return { ...data, [head]: [...list.slice(0, index), nextValue, ...list.slice(index + 1)] };
    const item = list[index];
    if (item === undefined || !isEditorObject(item)) return data;
    list[index] = updateAtPath(item, tail.slice(1), nextValue);
    return { ...data, [head]: list };
  }

  if (current === undefined || !isEditorObject(current)) return data;
  return { ...data, [head]: updateAtPath(current, tail, nextValue) };
}

function valueAtPath(
  data: EditorObject,
  path: readonly (string | number)[],
): EditorValue | undefined {
  let current: EditorValue = data;

  for (const segment of path) {
    let next: EditorValue | undefined;
    if (typeof segment === "number") {
      if (!Array.isArray(current)) return undefined;
      next = current[segment];
    } else {
      if (!isEditorObject(current)) return undefined;
      next = current[segment];
    }

    if (next === undefined) return undefined;
    current = next;
  }

  return current;
}

function normalizePreviewText(value: string) {
  return value.replace(/\s+/g, " ").trim().toLocaleLowerCase();
}

const nonContentKeys = new Set([
  "id",
  "url",
  "href",
  "type",
  "tile",
  "tint",
  "color",
  "pinType",
  "fx",
  "fy",
  "rot",
]);

function findPreviewPath(
  value: EditorValue,
  candidates: readonly string[],
  path: readonly (string | number)[] = [],
): readonly (string | number)[] | null {
  const matches: Array<Readonly<{ path: readonly (string | number)[]; score: number }>> = [];

  const visit = (entry: EditorValue, entryPath: readonly (string | number)[]) => {
    if (typeof entry === "string") {
      const lastSegment = entryPath.at(-1);
      if (typeof lastSegment === "string" && nonContentKeys.has(lastSegment)) return;
      const normalizedEntry = normalizePreviewText(entry);
      if (!normalizedEntry) return;

      candidates.forEach((candidate, candidateIndex) => {
        const exact = candidate === normalizedEntry;
        const contained =
          candidate.length > normalizedEntry.length && candidate.includes(normalizedEntry);
        if (!exact && !contained) return;
        const score = (exact ? 100_000 : 0) + normalizedEntry.length - candidateIndex * 100;
        matches.push({ path: entryPath, score });
      });
      return;
    }

    if (Array.isArray(entry)) {
      entry.forEach((item, index) => visit(item, [...entryPath, index]));
      return;
    }

    if (isEditorObject(entry)) {
      Object.entries(entry).forEach(([key, item]) => visit(item, [...entryPath, key]));
    }
  };

  visit(value, path);
  matches.sort((left, right) => right.score - left.score);
  return matches[0]?.path ?? null;
}

/* Reads a path as a breadcrumb of human labels, so "lanes.0.projects.2.image"
   becomes "Categories / Category 1 / Projects / Project 3 / Project cover photo". */
function pathLabel(path: readonly (string | number)[]) {
  return path.map((_, index) => fieldLabel(path.slice(0, index + 1))).join(" / ");
}

function parentLabel(path: readonly (string | number)[]) {
  return path.length > 1 ? pathLabel(path.slice(0, -1)) : "";
}

function emptyFromTemplate(value: EditorValue): EditorValue {
  if (typeof value === "string") return "";
  if (typeof value === "number") return 0;
  if (typeof value === "boolean") return false;
  if (value === null) return null;
  if (Array.isArray(value)) return [];
  const result: EditorObject = {};
  for (const [key, entry] of Object.entries(value)) {
    result[key] = key === "id" ? crypto.randomUUID() : emptyFromTemplate(entry);
  }
  return result;
}

function reorder(values: EditorValue[], activeId: string, overId: string) {
  const oldIndex = values.findIndex((value) => isEditorObject(value) && value.id === activeId);
  const newIndex = values.findIndex((value) => isEditorObject(value) && value.id === overId);
  return oldIndex < 0 || newIndex < 0 ? values : arrayMove(values, oldIndex, newIndex);
}

function itemTitle(value: EditorValue, fallback: string) {
  if (!isEditorObject(value)) return fallback;

  for (const key of ["title", "name", "company", "label", "caption", "kicker", "id"]) {
    const entry = value[key];
    if (typeof entry === "string" && entry) return entry;
  }

  return fallback;
}

function emptyArrayTemplate(path: readonly (string | number)[]): EditorValue | undefined {
  if (path[0] !== "quotes") return undefined;

  return {
    id: "",
    quote: "",
    name: "",
    role: "",
    initials: "",
    image: null,
    isSample: false,
  };
}

function blankWorkProject(): EditorObject {
  return {
    id: crypto.randomUUID(),
    title: "",
    subtitle: "",
    href: null,
    hrefLabel: null,
    image: null,
    thumbHint: "bd-1",
    preview: null,
  };
}

function blankRoomPicture(): EditorObject {
  return {
    id: crypto.randomUUID(),
    type: "polaroid",
    image: null,
    tint: "rg1",
    tag: "",
    caption: "",
    subCaption: "",
    fx: 0.12,
    fy: 0.12,
    rot: 0,
    pinType: "pin",
  };
}

function SortableCard({ id, children }: Readonly<{ id: string; children: React.ReactNode }>) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div className="studio-editor-card" ref={setNodeRef} style={style}>
      <button
        className="studio-drag-handle"
        type="button"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        ::
      </button>
      {children}
    </div>
  );
}

type ValueEditorProps = Readonly<{
  value: EditorValue;
  label: string;
  path: readonly (string | number)[];
  onChange: (path: readonly (string | number)[], value: EditorValue) => void;
  uploadEnabled: boolean;
}>;

function FieldHint({ id, hint }: Readonly<{ id: string; hint?: string }>) {
  if (!hint) return null;
  return (
    <small className="studio-field__hint" id={id}>
      {hint}
    </small>
  );
}

function ScalarEditor({ value, label, path, onChange }: ValueEditorProps) {
  const key = String(path[path.length - 1] ?? "");
  const options = selectOptions[key];
  const id = `studio-${path.join("-")}`;
  const hintId = `${id}-hint`;
  const { hint } = describeField(path);
  const describedBy = hint ? hintId : undefined;

  if (typeof value === "boolean") {
    return (
      <div className="studio-switch-field">
        <label className="studio-switch" htmlFor={id}>
          <span>{label}</span>
          <input
            id={id}
            type="checkbox"
            checked={value}
            aria-describedby={describedBy}
            onChange={(event) => onChange(path, event.target.checked)}
          />
        </label>
        <FieldHint id={hintId} hint={hint} />
      </div>
    );
  }

  if (typeof value === "number") {
    return (
      <label className="studio-field" htmlFor={id}>
        <span>{label}</span>
        <input
          id={id}
          type="number"
          value={value}
          step="any"
          aria-describedby={describedBy}
          onChange={(event) => onChange(path, Number(event.target.value))}
        />
        <FieldHint id={hintId} hint={hint} />
      </label>
    );
  }

  if (value === null) {
    return (
      <label className="studio-field" htmlFor={id}>
        <span>{label}</span>
        <input
          id={id}
          value=""
          placeholder="Not set"
          aria-describedby={describedBy}
          onChange={(event) => onChange(path, event.target.value || null)}
        />
        <FieldHint id={hintId} hint={hint ?? "Empty. Type a value to set it."} />
      </label>
    );
  }

  if (typeof value !== "string") return null;

  if (options) {
    return (
      <label className="studio-field" htmlFor={id}>
        <span>{label}</span>
        <select
          id={id}
          value={value}
          aria-describedby={describedBy}
          onChange={(event) => onChange(path, event.target.value || null)}
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option || "None"}
            </option>
          ))}
        </select>
        <FieldHint id={hintId} hint={hint} />
      </label>
    );
  }

  const multiline =
    value.length > 74 ||
    /description|approach|paragraph|quote|headline|sub|intro|tagline|text/i.test(key);
  return (
    <label className="studio-field" htmlFor={id}>
      <span>
        {label}
        {key === "sub" || key === "description" ? <b>{value.length} characters</b> : null}
      </span>
      {multiline ? (
        <textarea
          id={id}
          value={value}
          rows={Math.min(6, Math.max(3, Math.ceil(value.length / 68)))}
          aria-describedby={describedBy}
          onChange={(event) => onChange(path, event.target.value)}
        />
      ) : (
        <input
          id={id}
          value={value}
          aria-describedby={describedBy}
          onChange={(event) => onChange(path, event.target.value)}
        />
      )}
      <FieldHint id={hintId} hint={hint} />
    </label>
  );
}

type MediaConfig = Readonly<{
  endpoint: UploadEndpoint;
  acceptsAlt: boolean;
  isVideo?: boolean;
  isOptional?: boolean;
  isUrlOnly?: boolean;
}>;

function getMediaConfig(
  value: EditorValue,
  path: readonly (string | number)[],
): MediaConfig | undefined {
  const key = String(path[path.length - 1] ?? "");
  if (key === "bgVideo" && isEditorObject(value)) {
    return { endpoint: "heroVideo", acceptsAlt: false, isVideo: true };
  }
  if (key === "portraitVideo" && (value === null || isEditorObject(value))) {
    return { endpoint: "heroVideo", acceptsAlt: false, isVideo: true, isOptional: true };
  }
  if (key === "portrait" && (value === null || isEditorObject(value))) {
    return { endpoint: "portrait", acceptsAlt: true };
  }
  if (key === "logo" && (value === null || isEditorObject(value))) {
    return { endpoint: "logoImage", acceptsAlt: false };
  }
  if (key === "ogImage" && (value === null || isEditorObject(value))) {
    return { endpoint: "ogImage", acceptsAlt: false };
  }
  if (key === "image" && (value === null || isEditorObject(value))) {
    const pathKeys = path.filter((part): part is string => typeof part === "string");
    const endpoint = pathKeys.includes("quotes")
      ? "praiseImage"
      : pathKeys.includes("roles")
        ? "experienceImage"
        : pathKeys.includes("slots")
          ? "boothImage"
          : pathKeys.includes("worked")
            ? "impactImage"
            : "roomImage";
    return {
      endpoint,
      acceptsAlt: true,
    };
  }
  return undefined;
}

type MediaField = Readonly<{
  path: readonly (string | number)[];
  value: EditorValue;
}>;

function collectMediaFields(
  value: EditorValue,
  path: readonly (string | number)[] = [],
): readonly MediaField[] {
  if (getMediaConfig(value, path)) return [{ path, value }];

  if (Array.isArray(value)) {
    return value.flatMap((entry, index) => collectMediaFields(entry, [...path, index]));
  }

  if (isEditorObject(value)) {
    return Object.entries(value).flatMap(([key, entry]) =>
      collectMediaFields(entry, [...path, key]),
    );
  }

  return [];
}

/* Work projects hold their video as a YouTube address rather than an upload, so the
   editor treats that link as an asset in its own right: it is collected, previewed
   and managed alongside the real uploads. */
function isVideoLinkField(value: EditorValue, path: readonly (string | number)[]) {
  return (
    String(path.at(-1) ?? "") === "href" &&
    path.includes("projects") &&
    (value === null || typeof value === "string")
  );
}

function collectLinkFields(
  value: EditorValue,
  path: readonly (string | number)[] = [],
): readonly MediaField[] {
  if (isVideoLinkField(value, path)) return [{ path, value }];

  if (Array.isArray(value)) {
    return value.flatMap((entry, index) => collectLinkFields(entry, [...path, index]));
  }

  if (isEditorObject(value)) {
    return Object.entries(value).flatMap(([key, entry]) =>
      collectLinkFields(entry, [...path, key]),
    );
  }

  return [];
}

function hasMedia(value: EditorValue) {
  if (typeof value === "string") return value.length > 0;
  return isEditorObject(value) && typeof value.url === "string" && value.url.length > 0;
}

/* A short "what is set here" line for list rows, so an editor can see at a glance
   which entries still have no photo or video link without opening each one. */
function mediaSummary(value: EditorValue, path: readonly (string | number)[]) {
  const fields = collectMediaFields(value, path);
  const links = collectLinkFields(value, path);
  if (fields.length === 0 && links.length === 0) return "Text only";

  const counts: Record<MediaKindLabel, { total: number; filled: number }> = {
    photo: { total: 0, filled: 0 },
    video: { total: 0, filled: 0 },
  };

  for (const field of fields) {
    const kind: MediaKindLabel = getMediaConfig(field.value, field.path)?.isVideo
      ? "video"
      : "photo";
    counts[kind].total += 1;
    if (hasMedia(field.value)) counts[kind].filled += 1;
  }

  const parts = (["photo", "video"] as const)
    .filter((kind) => counts[kind].total > 0)
    .map((kind) => {
      const { filled } = counts[kind];
      return filled === 0 ? `no ${kind} yet` : `${filled} ${kind}${filled > 1 ? "s" : ""}`;
    });

  if (links.length > 0) {
    const filled = links.filter((link) => typeof link.value === "string" && link.value).length;
    parts.push(
      filled === 0
        ? "no video link yet"
        : filled === 1
          ? "video link set"
          : `${filled} video links`,
    );
  }

  return parts.join(" · ");
}

function setOptionalString(object: EditorObject, key: string, value: string): EditorObject {
  const next = { ...object };
  if (value) next[key] = value;
  else delete next[key];
  return next;
}

function MediaEditor({
  value,
  label,
  path,
  onChange,
  uploadEnabled,
  showBreadcrumb,
}: ValueEditorProps & { showBreadcrumb?: boolean }) {
  const config = getMediaConfig(value, path);
  if (!config) return null;

  const kind: MediaKindLabel = config.isVideo ? "video" : "photo";
  const spec = mediaSpecs[kind];
  const { hint } = describeField(path);
  const breadcrumb = showBreadcrumb ? parentLabel(path) : "";

  const object = isEditorObject(value) ? value : {};
  const url = config.isUrlOnly
    ? typeof value === "string"
      ? value
      : ""
    : typeof object.url === "string"
      ? object.url
      : "";
  const alt = typeof object.alt === "string" ? object.alt : "";
  const poster = typeof object.poster === "string" ? object.poster : "";
  const duotone = object.duotone === true;

  const setUrl = (nextUrl: string) => {
    if (config.isUrlOnly) {
      onChange(path, nextUrl || null);
      return;
    }
    if (!nextUrl && (!config.isVideo || config.isOptional)) {
      onChange(path, null);
      return;
    }
    onChange(path, { ...object, url: nextUrl });
  };

  return (
    <fieldset className={`studio-object studio-media-field studio-media-field--${kind}`}>
      <legend>
        <span className={`studio-media-badge studio-media-badge--${kind}`}>{spec.badge}</span>
        <span className="studio-media-field__name">{label}</span>
        {config.isOptional ? <em className="studio-media-field__flag">Optional</em> : null}
      </legend>
      {breadcrumb ? <p className="studio-media-field__where">{breadcrumb}</p> : null}
      <p className="studio-media-field__hint">
        {hint ??
          (kind === "video"
            ? "A video that plays in this part of the page."
            : "An image that appears in this part of the page.")}
      </p>
      <p className="studio-media-field__spec">
        {spec.accepts}
        {url ? null : <span> · nothing uploaded yet</span>}
      </p>
      <Dropzone
        endpoint={config.endpoint}
        label={spec.action}
        value={url || undefined}
        enabled={uploadEnabled}
        onUploaded={(upload) => setUrl(upload.url)}
        onDeleted={() => setUrl("")}
      />
      <label className="studio-field" htmlFor={`studio-${path.join("-")}-url`}>
        <span>{kind === "video" ? "Video address" : "Photo address"}</span>
        <input
          id={`studio-${path.join("-")}-url`}
          type="url"
          value={url}
          placeholder="https://"
          aria-describedby={`studio-${path.join("-")}-url-hint`}
          onChange={(event) => setUrl(event.target.value)}
        />
        <FieldHint
          id={`studio-${path.join("-")}-url-hint`}
          hint={`Filled in for you when you upload above. Clear it to remove this ${kind}.`}
        />
      </label>
      {config.acceptsAlt ? (
        <label className="studio-field" htmlFor={`studio-${path.join("-")}-alt`}>
          <span>Alt text (describe the photo)</span>
          <input
            id={`studio-${path.join("-")}-alt`}
            value={alt}
            placeholder="e.g. Madhu at the edit desk, mid-cut"
            aria-describedby={`studio-${path.join("-")}-alt-hint`}
            onChange={(event) => onChange(path, { ...object, url, alt: event.target.value })}
          />
          <FieldHint
            id={`studio-${path.join("-")}-alt-hint`}
            hint="Read aloud by screen readers and shown if the photo fails to load. Say what is in the picture."
          />
        </label>
      ) : null}
      {config.isVideo && !config.isUrlOnly ? (
        <>
          <label className="studio-field" htmlFor={`studio-${path.join("-")}-poster`}>
            <span>Poster photo address</span>
            <input
              id={`studio-${path.join("-")}-poster`}
              type="url"
              value={poster}
              placeholder="https://"
              aria-describedby={`studio-${path.join("-")}-poster-hint`}
              onChange={(event) =>
                onChange(path, setOptionalString(object, "poster", event.target.value))
              }
            />
            <FieldHint
              id={`studio-${path.join("-")}-poster-hint`}
              hint="A still image shown while the video loads, or if it cannot play. Optional but recommended."
            />
          </label>
          <div className="studio-switch-field">
            <label className="studio-switch" htmlFor={`studio-${path.join("-")}-duotone`}>
              <span>Duotone tint</span>
              <input
                id={`studio-${path.join("-")}-duotone`}
                type="checkbox"
                checked={duotone}
                aria-describedby={`studio-${path.join("-")}-duotone-hint`}
                onChange={(event) => onChange(path, { ...object, duotone: event.target.checked })}
              />
            </label>
            <FieldHint
              id={`studio-${path.join("-")}-duotone-hint`}
              hint="Washes the video in the site's orange-and-black treatment. Turn it off to show the original colours."
            />
          </div>
        </>
      ) : null}
    </fieldset>
  );
}

/* The counterpart to MediaEditor for a YouTube-hosted video: same card shape and
   Video badge, but the address itself is the asset, so it gets a live thumbnail,
   a way to replace it, and a way to clear it. */
function LinkEditor({
  value,
  label,
  path,
  onChange,
  showBreadcrumb,
}: ValueEditorProps & { showBreadcrumb?: boolean }) {
  const url = typeof value === "string" ? value : "";
  const videoId = getYouTubeId(url);
  const thumbnail = getYouTubeThumbnail(url);
  const { hint } = describeField(path);
  const breadcrumb = showBreadcrumb ? parentLabel(path) : "";
  const inputId = `studio-${path.join("-")}-link`;

  return (
    <fieldset className="studio-object studio-media-field studio-media-field--video studio-link-field">
      <legend>
        <span className="studio-media-badge studio-media-badge--video">Video</span>
        <span className="studio-media-field__name">{label}</span>
      </legend>
      {breadcrumb ? <p className="studio-media-field__where">{breadcrumb}</p> : null}
      <p className="studio-media-field__hint">{hint}</p>
      <div className="studio-link-field__preview">
        {thumbnail ? (
          /* eslint-disable-next-line @next/next/no-img-element -- a YouTube still keyed
             off a value the editor is typing, so it cannot be statically optimised. */
          <img src={thumbnail} alt={`Thumbnail of the linked YouTube video`} />
        ) : (
          <p>
            {url
              ? "That is not a YouTube address, so there is no thumbnail and no in-page player. The link still opens from the pop-up."
              : "No link yet. Paste a YouTube address below and its thumbnail appears here."}
          </p>
        )}
      </div>
      <label className="studio-field" htmlFor={inputId}>
        <span>{url ? "Change the link" : "Paste the YouTube link"}</span>
        <input
          id={inputId}
          type="url"
          value={url}
          placeholder="https://youtu.be/..."
          aria-describedby={`${inputId}-hint`}
          onChange={(event) => onChange(path, event.target.value || null)}
        />
        <FieldHint
          id={`${inputId}-hint`}
          hint="Paste a new address over the old one to swap the video. The card thumbnail and the pop-up player follow it straight away."
        />
      </label>
      <div className="studio-link-field__actions">
        {url ? (
          <a href={url} target="_blank" rel="noreferrer">
            Open the link to check it <span aria-hidden="true">&#8599;</span>
          </a>
        ) : null}
        {videoId ? <em>Video ID {videoId}</em> : null}
        {url ? (
          <button type="button" onClick={() => onChange(path, null)}>
            Clear link
          </button>
        ) : null}
      </div>
    </fieldset>
  );
}

function ArrayEditor({
  value,
  label,
  path,
  onChange,
  uploadEnabled,
}: ValueEditorProps & { value: EditorValue[] }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const sortableIds = value.flatMap((item) =>
    isEditorObject(item) && typeof item.id === "string" ? [item.id] : [],
  );
  const isSortable = sortableIds.length === value.length && value.length > 1;
  const [lastTemplate, setLastTemplate] = useState<EditorValue | undefined>(value[0]);
  const template = value[0] ?? lastTemplate ?? emptyArrayTemplate(path);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const activeIndex = Math.min(selectedIndex, Math.max(0, value.length - 1));
  const selectedItem = value[activeIndex];
  const doc = describeField(path);
  const itemNoun = doc.itemLabel ?? (label.endsWith("s") ? label.slice(0, -1) : label);

  const handleDragEnd = (event: DragEndEvent) => {
    if (!event.over || event.active.id === event.over.id) return;
    onChange(path, reorder(value, String(event.active.id), String(event.over.id)));
  };

  const records = value.map((item, index) => {
    const summary = mediaSummary(item, [...path, index]);
    const record = (
      <button
        className={`studio-array__record${activeIndex === index ? " is-active" : ""}`}
        type="button"
        onClick={() => setSelectedIndex(index)}
        aria-pressed={activeIndex === index}
      >
        <span>
          <b>{itemTitle(item, `${itemNoun} ${index + 1}`)}</b>
          <small>
            {`${itemNoun} ${index + 1}`}
            {summary === "Text only" ? "" : ` · ${summary}`}
          </small>
        </span>
        <i aria-hidden="true">→</i>
      </button>
    );

    if (!isSortable || !isEditorObject(item) || typeof item.id !== "string") {
      return (
        <div className="studio-array__record-wrap" key={`${label}-${index}`}>
          {record}
        </div>
      );
    }

    return (
      <SortableCard key={item.id} id={item.id}>
        {record}
      </SortableCard>
    );
  });

  const addItem = () => {
    if (template === undefined) return;
    onChange(path, [...value, emptyFromTemplate(template)]);
    setSelectedIndex(value.length);
  };

  const addWorkProject = () => {
    onChange(path, [...value, blankWorkProject()]);
    setSelectedIndex(value.length);
  };

  const addRoomPicture = () => {
    onChange(path, [...value, blankRoomPicture()]);
    setSelectedIndex(value.length);
  };

  const removeSelectedItem = () => {
    if (selectedItem === undefined) return;
    setLastTemplate(selectedItem);
    onChange(
      path,
      value.filter((_, index) => index !== activeIndex),
    );
    setSelectedIndex(Math.max(0, activeIndex - 1));
  };

  return (
    <section className="studio-array" aria-label={label}>
      <header>
        <div className="studio-array__title">
          <h2>
            {label} <span className="studio-array__count">{value.length}</span>
          </h2>
          {doc.hint ? <p className="studio-array__hint">{doc.hint}</p> : null}
          {isSortable ? (
            <p className="studio-array__reorder-hint">
              Drag the <b>::</b> handle beside a row to change the order it appears in on the site.
            </p>
          ) : null}
        </div>
        {/* Projects get a purpose-built blank instead of the generic "copy the shape
            of the first entry" button, so there is only ever one way to add one. */}
        {template !== undefined && path.at(-1) !== "projects" ? (
          <button className="studio-add-row" type="button" onClick={addItem}>
            {path.at(-1) === "cards"
              ? "Add card (same type as the first)"
              : `Add ${itemNoun.toLowerCase()}`}
          </button>
        ) : null}
        {path.at(-1) === "projects" ? (
          <button className="studio-add-row" type="button" onClick={addWorkProject}>
            Add project
          </button>
        ) : null}
        {path.at(-1) === "cards" ? (
          <button className="studio-add-row" type="button" onClick={addRoomPicture}>
            Add polaroid (photo card)
          </button>
        ) : null}
      </header>
      {value.length > 0 ? (
        <div className="studio-array__workspace">
          <div className="studio-array__records" aria-label={`${label} list`}>
            {isSortable ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
                  {records}
                </SortableContext>
              </DndContext>
            ) : (
              records
            )}
          </div>
          {selectedItem !== undefined ? (
            <div className="studio-array__detail">
              <header>
                <div>
                  <span>{`Editing ${itemNoun.toLowerCase()} ${activeIndex + 1} of ${value.length}`}</span>
                  <strong>{itemTitle(selectedItem, `${itemNoun} ${activeIndex + 1}`)}</strong>
                </div>
                <button
                  className="studio-row-remove"
                  type="button"
                  aria-label={`Remove ${itemNoun} ${activeIndex + 1}`}
                  onClick={removeSelectedItem}
                >
                  Remove
                </button>
              </header>
              <ValueEditor
                value={selectedItem}
                label={`${itemNoun} ${activeIndex + 1}`}
                path={[...path, activeIndex]}
                onChange={onChange}
                uploadEnabled={uploadEnabled}
              />
            </div>
          ) : null}
        </div>
      ) : (
        <p className="studio-array__empty">
          No {label.toLowerCase()} yet. Use “Add {itemNoun.toLowerCase()}” above to create the first
          one.
        </p>
      )}
    </section>
  );
}

function ValueEditor({ value, label, path, onChange, uploadEnabled }: ValueEditorProps) {
  if (isVideoLinkField(value, path)) {
    return (
      <LinkEditor
        value={value}
        label={label}
        path={path}
        onChange={onChange}
        uploadEnabled={uploadEnabled}
      />
    );
  }

  if (getMediaConfig(value, path)) {
    return (
      <MediaEditor
        value={value}
        label={label}
        path={path}
        onChange={onChange}
        uploadEnabled={uploadEnabled}
      />
    );
  }

  if (Array.isArray(value))
    return (
      <ArrayEditor
        value={value}
        label={label}
        path={path}
        onChange={onChange}
        uploadEnabled={uploadEnabled}
      />
    );

  if (isEditorObject(value)) {
    const { hint } = describeField(path);
    return (
      <fieldset className="studio-object">
        <legend>{label}</legend>
        {hint ? <p className="studio-object__hint">{hint}</p> : null}
        {Object.entries(value).map(([key, entry]) => (
          <ValueEditor
            key={key}
            value={entry}
            label={fieldLabel([...path, key])}
            path={[...path, key]}
            onChange={onChange}
            uploadEnabled={uploadEnabled}
          />
        ))}
      </fieldset>
    );
  }

  return (
    <ScalarEditor
      value={value}
      label={label}
      path={path}
      onChange={onChange}
      uploadEnabled={uploadEnabled}
    />
  );
}

type SectionEditorProps = Readonly<{
  section: SectionKey;
  data: unknown;
  uploadEnabled: boolean;
  contactData: unknown;
}>;

export function SectionEditor({ section, data, uploadEnabled, contactData }: SectionEditorProps) {
  const router = useRouter();
  const [savedData, setSavedData] = useState(() => normalizeObject(data));
  const [currentData, setCurrentData] = useState(() => normalizeObject(data));
  const currentDataRef = useRef(currentData);
  const [activePath, setActivePath] = useState<readonly (string | number)[]>(() => {
    const firstKey = Object.keys(savedData)[0];
    return firstKey ? [firstKey] : [];
  });
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [inspectorTab, setInspectorTab] = useState<"content" | "media">("content");
  const { formState, handleSubmit, reset, setValue } = useForm<{ data: unknown }>({
    defaultValues: { data: savedData },
  });
  const markDirty = useStudioStore((state) => state.markDirty);
  const clearDirty = useStudioStore((state) => state.clearDirty);
  const pushToast = useStudioStore((state) => state.pushToast);
  const registerDraftHandlers = useStudioStore((state) => state.registerDraftHandlers);
  const previewData = useDeferredValue(currentData);

  const updateValue = useCallback(
    (path: readonly (string | number)[], value: EditorValue) => {
      const nextData = updateAtPath(currentDataRef.current, path, value);
      currentDataRef.current = nextData;
      setCurrentData(nextData);
      setValue("data", nextData, {
        shouldDirty: true,
      });
    },
    [setValue],
  );

  const handleSave = useCallback(async () => {
    let saved = false;
    await handleSubmit(
      async (values) => {
        const result = await saveDraft(section, values.data);
        if (!result.ok) {
          pushToast(result.error, "error");
          return;
        }
        const nextData = normalizeObject(result.data);
        setSavedData(nextData);
        currentDataRef.current = nextData;
        setCurrentData(nextData);
        reset({ data: nextData });
        clearDirty(section);
        pushToast("Draft saved", "success");
        router.refresh();
        saved = true;
      },
      () => pushToast("Validation failed. Check the highlighted fields.", "error"),
    )();
    return saved;
  }, [clearDirty, handleSubmit, pushToast, reset, router, section]);

  const handleDiscard = useCallback(() => {
    currentDataRef.current = savedData;
    setCurrentData(savedData);
    reset({ data: savedData });
    clearDirty(section);
  }, [clearDirty, reset, savedData, section]);

  useEffect(
    () => registerDraftHandlers(section, { save: handleSave, discard: handleDiscard }),
    [handleDiscard, handleSave, registerDraftHandlers, section],
  );

  useEffect(() => {
    if (formState.isDirty) markDirty(section);
  }, [formState.isDirty, markDirty, section]);

  const fallbackKey = Object.keys(currentData)[0];
  const selectedPath =
    activePath.length > 0 && valueAtPath(currentData, activePath) !== undefined
      ? activePath
      : fallbackKey
        ? [fallbackKey]
        : [];
  const selectedRootKey = typeof selectedPath[0] === "string" ? selectedPath[0] : "";
  const activeValue = valueAtPath(currentData, selectedPath);
  const mediaFields = collectMediaFields(currentData);
  const photoFields = mediaFields.filter(
    (field) => !getMediaConfig(field.value, field.path)?.isVideo,
  );
  const videoFields = mediaFields.filter(
    (field) => getMediaConfig(field.value, field.path)?.isVideo,
  );
  const linkFields = collectLinkFields(currentData);
  const assetCount = mediaFields.length + linkFields.length;
  const assetGroups = [
    {
      key: "photo",
      kind: "photo" as const,
      title: "Photos",
      note: mediaSpecs.photo.accepts,
      fields: photoFields,
      isLink: false,
    },
    {
      key: "video",
      kind: "video" as const,
      title: "Videos",
      note: mediaSpecs.video.accepts,
      fields: videoFields,
      isLink: false,
    },
    {
      key: "link",
      kind: "video" as const,
      title: "Video links",
      note: "Hosted on YouTube - paste a link, nothing is uploaded",
      fields: linkFields,
      isLink: true,
    },
  ].filter((group) => group.fields.length > 0);

  return (
    <section
      className={`studio-page studio-editor studio-editor--${section}`}
      aria-labelledby="studio-section-title"
    >
      <div className="studio-editor__heading">
        <div>
          <span className="slate">Visual editor</span>
          <h1 id="studio-section-title">{studioSectionLabels[section]}</h1>
          <p>{sectionDocs[section].summary}</p>
          <p className="studio-editor__media-note">
            <span className="studio-media-badge studio-media-badge--info">Uploads</span>
            {sectionDocs[section].media}
          </p>
        </div>
        <div className="studio-device-switch" aria-label="Preview device">
          <button
            className={previewDevice === "desktop" ? "is-active" : ""}
            type="button"
            aria-pressed={previewDevice === "desktop"}
            onClick={() => setPreviewDevice("desktop")}
          >
            Desktop
          </button>
          <button
            className={previewDevice === "mobile" ? "is-active" : ""}
            type="button"
            aria-pressed={previewDevice === "mobile"}
            onClick={() => setPreviewDevice("mobile")}
          >
            Mobile
          </button>
        </div>
      </div>
      <ol className="studio-howto" aria-label="How to edit this section">
        <li>
          <b>1</b>
          <span>
            <strong>Pick what to change.</strong> Click any text in the preview on the left, or
            choose a field from the <em>Content</em> list on the right.
          </span>
        </li>
        <li>
          <b>2</b>
          <span>
            <strong>Add photos and videos.</strong> Open the <em>Media</em> tab on the right. Every
            upload in this section is there, each marked <em>Photo</em> or <em>Video</em> with the
            file size it accepts.
          </span>
        </li>
        <li>
          <b>3</b>
          <span>
            <strong>Save, then publish.</strong> <em>Save section</em> stores a private draft.
            Nothing changes on the live site until you press <em>Publish</em> in the top bar.
          </span>
        </li>
      </ol>
      <div className="studio-editor__layout">
        <section
          className={`studio-canvas studio-canvas--${previewDevice}`}
          aria-label="Landing-page preview"
        >
          <header className="studio-canvas__topbar">
            <span>Click any visible text to edit it</span>
            <span>Live draft</span>
          </header>
          <div
            className="studio-canvas__viewport studio-canvas__viewport--editable"
            onClickCapture={(event) => {
              const target = event.target;
              if (!(target instanceof HTMLElement)) return;

              const candidates: string[] = [];
              let node: HTMLElement | null = target;
              while (node && node !== event.currentTarget) {
                const text = normalizePreviewText(node.textContent ?? "");
                if (text && !candidates.includes(text)) candidates.push(text);
                node = node.parentElement;
              }

              const path = findPreviewPath(currentData, candidates);
              if (!path) return;
              event.preventDefault();
              event.stopPropagation();
              setActivePath(path);
              setInspectorTab("content");
            }}
          >
            <StudioLandingPreview section={section} data={previewData} contactData={contactData} />
          </div>
        </section>
        <aside className="studio-inspector" aria-label="Element inspector">
          <header className="studio-inspector__heading">
            <div>
              <span>Inspector</span>
              <h2>{studioSectionLabels[section]}</h2>
            </div>
            <small>{Object.keys(currentData).length} fields</small>
          </header>
          <div className="studio-inspector__tabs" role="tablist" aria-label="Inspector mode">
            <button
              type="button"
              role="tab"
              aria-selected={inspectorTab === "content"}
              className={inspectorTab === "content" ? "is-active" : ""}
              onClick={() => setInspectorTab("content")}
            >
              Content
            </button>
            {assetCount > 0 ? (
              <button
                type="button"
                role="tab"
                aria-selected={inspectorTab === "media"}
                className={inspectorTab === "media" ? "is-active" : ""}
                onClick={() => setInspectorTab("media")}
              >
                Photos &amp; video <span>{assetCount}</span>
              </button>
            ) : null}
          </div>
          {inspectorTab === "media" && assetCount > 0 ? (
            <section className="studio-inspector__media" aria-labelledby="studio-media-title">
              <header>
                <span>Photos &amp; video</span>
                <h2 id="studio-media-title">
                  {[
                    photoFields.length > 0
                      ? `${photoFields.length} photo${photoFields.length === 1 ? "" : "s"}`
                      : "",
                    videoFields.length > 0
                      ? `${videoFields.length} video${videoFields.length === 1 ? "" : "s"}`
                      : "",
                    linkFields.length > 0
                      ? `${linkFields.length} video link${linkFields.length === 1 ? "" : "s"}`
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </h2>
                <p>
                  Every picture and video this section uses, and where each one lands on the page.
                  Uploaded files say the size they accept; video links are YouTube addresses you
                  paste, with nothing stored here. Either way, nothing goes live until you save the
                  section and publish.
                </p>
              </header>
              <div>
                {assetGroups.map((group) => (
                  <section className="studio-media-group" key={group.key}>
                    <h3>
                      <span className={`studio-media-badge studio-media-badge--${group.kind}`}>
                        {mediaSpecs[group.kind].badge}
                      </span>
                      {group.title}
                      <em>{group.note}</em>
                    </h3>
                    {group.fields.map(({ path, value }) =>
                      group.isLink ? (
                        <LinkEditor
                          key={path.join("-")}
                          value={value}
                          label={fieldLabel(path)}
                          path={path}
                          onChange={updateValue}
                          uploadEnabled={uploadEnabled}
                          showBreadcrumb
                        />
                      ) : (
                        <MediaEditor
                          key={path.join("-")}
                          value={value}
                          label={fieldLabel(path)}
                          path={path}
                          onChange={updateValue}
                          uploadEnabled={uploadEnabled}
                          showBreadcrumb
                        />
                      ),
                    )}
                  </section>
                ))}
              </div>
            </section>
          ) : (
            <div className="studio-inspector__content">
              <nav className="studio-inspector__elements" aria-label="Editable elements">
                {Object.entries(currentData).map(([key, value], index) => {
                  const doc = describeField([key]);
                  const rootConfig = getMediaConfig(value, [key]);
                  const kindTag = rootConfig
                    ? rootConfig.isVideo
                      ? "Video"
                      : "Photo"
                    : Array.isArray(value)
                      ? `${value.length} ${
                          value.length === 1
                            ? (doc.itemLabel ?? "item").toLowerCase()
                            : `${(doc.itemLabel ?? "item").toLowerCase()}s`
                        }`
                      : isEditorObject(value)
                        ? "Group"
                        : typeof value === "boolean"
                          ? "On / off"
                          : typeof value === "number"
                            ? "Number"
                            : "Text";

                  return (
                    <button
                      className={selectedRootKey === key ? "is-active" : ""}
                      type="button"
                      key={key}
                      title={doc.hint}
                      aria-pressed={selectedRootKey === key}
                      onClick={() => setActivePath([key])}
                    >
                      <i aria-hidden="true">{String(index + 1).padStart(2, "0")}</i>
                      <span>{doc.label}</span>
                      <small>{kindTag}</small>
                    </button>
                  );
                })}
              </nav>
              {activeValue !== undefined ? (
                <form
                  className="studio-inspector__form"
                  onSubmit={(event) => void handleSubmit(() => undefined)(event)}
                >
                  <div className="studio-inspector__selected">
                    <span>Now editing</span>
                    <h2>{fieldLabel(selectedPath)}</h2>
                    {selectedPath.length > 1 ? (
                      <p className="studio-inspector__breadcrumb">{pathLabel(selectedPath)}</p>
                    ) : null}
                  </div>
                  <ValueEditor
                    value={activeValue}
                    label={fieldLabel(selectedPath)}
                    path={selectedPath}
                    onChange={updateValue}
                    uploadEnabled={uploadEnabled}
                  />
                </form>
              ) : null}
            </div>
          )}
          <SaveBar />
        </aside>
      </div>
      {section === "settings" ? <SettingsDangerZone /> : null}
    </section>
  );
}
