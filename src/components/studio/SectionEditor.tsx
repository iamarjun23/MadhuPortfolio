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
import { MediaPreview } from "@/components/studio/MediaPreview";
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
import { reelSourceLabel, resolveReel } from "@/lib/reel";
import { useStudioStore } from "@/stores/studio-store";

type EditorValue = string | number | boolean | null | EditorObject | EditorValue[];
type EditorObject = { [key: string]: EditorValue };

const roomTints = ["rg1", "rg2", "rg3", "rg4", "rg5", "rg6"] as const;

const selectOptions: Record<string, readonly string[]> = {
  defaultTheme: ["suite", "sheet", "system"],
  hrefLabel: ["", "YouTube", "LinkedIn"],
  logoHint: ["l-jar", "l-onep", "l-ulc", "l-hb", "custom"],
  pinType: ["pin", "pin-signal", "tape", "none"],
  thumbHint: ["bd-1", "bd-2", "bd-3", "bd-4"],
  tile: ["a", "b", "c", "d", "e", "f", "g", "h"],
  tint: roomTints,
  type: ["polaroid", "video", "note", "quote", "ig", "tags"],
  color: ["ember", "signal"],
};

/* `tint` means two different things on a drawing-room card - the wash behind a
   polaroid, and the colour of one word in a tag cluster - and offering the wrong
   set writes a value the schema rejects at save time. The board's six tiles are
   the same six washes, but they sit in a list, so their key is an index. */
function optionsForPath(path: readonly (string | number)[]): readonly string[] | undefined {
  const key = String(path.at(-1) ?? "");
  if (key === "tint") {
    return path.includes("tags") ? ["default", "ember", "signal"] : roomTints;
  }
  if (typeof path.at(-1) === "number" && path.at(-2) === "tiles") return roomTints;
  return selectOptions[key];
}

/* Every field a drawing-room card of a given type must carry. Switching the type
   in the picker swaps the card onto this shape: without it the card keeps the
   old type's fields, the preview cannot parse it, and the save is refused. */
function roomCardShape(type: string): EditorObject {
  switch (type) {
    case "video":
      return {
        href: null,
        video: null,
        image: null,
        tint: "rg1",
        tag: "Reel",
        caption: "",
        subCaption: "",
      };
    case "note":
      return { color: "ember", kicker: "", text: "" };
    case "quote":
      return { text: "", attribution: "" };
    case "ig":
      return {
        handle: "",
        tiles: [...roomTints],
        ctaLabel: "Follow along",
        ctaHref: "https://instagram.com/",
      };
    case "tags":
      return { kicker: "", tags: [] };
    default:
      return { image: null, tint: "rg1", tag: "", caption: "", subCaption: "" };
  }
}

function isRoomCardTypePath(path: readonly (string | number)[]) {
  return path.at(-1) === "type" && path.at(-3) === "cards" && typeof path.at(-2) === "number";
}

/* Keeps the card's identity and its place on the board, keeps any words whose
   field survives the change, and fills the rest of the new shape with blanks. */
function retypeRoomCard(card: EditorValue, nextType: string): EditorObject {
  const previous = isEditorObject(card) ? card : {};
  const shape = roomCardShape(nextType);
  const next: EditorObject = {
    id: typeof previous.id === "string" ? previous.id : crypto.randomUUID(),
    type: nextType,
    fx: typeof previous.fx === "number" ? previous.fx : 0.12,
    fy: typeof previous.fy === "number" ? previous.fy : 0.12,
    rot: typeof previous.rot === "number" ? previous.rot : 0,
    pinType: typeof previous.pinType === "string" ? previous.pinType : "pin",
  };

  for (const [key, blank] of Object.entries(shape)) {
    const carried = previous[key];
    next[key] =
      carried !== undefined && typeof carried === typeof blank && !Array.isArray(blank)
        ? carried
        : blank;
  }

  return next;
}

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

function emptyFromTemplate(
  value: EditorValue,
  path: readonly (string | number)[] = [],
): EditorValue {
  if (typeof value === "string") {
    // A field with a fixed option list (logoHint, pinType, tint, ...) has no
    // blank value the schema accepts - "" isn't one of the enum's options -
    // so a new item keeps the template's own valid choice instead of losing it.
    return optionsForPath(path) ? value : "";
  }
  if (typeof value === "number") return 0;
  if (typeof value === "boolean") return false;
  if (value === null) return null;
  if (Array.isArray(value)) return [];
  // A media field (image/video/logo/...) is nullable in the schema, and "empty"
  // for it means null - not an object with blank strings, which fails upload
  // URL validation and permanently breaks the preview until a file is chosen.
  if (getMediaConfig(value, path)) return null;
  const result: EditorObject = {};
  for (const [key, entry] of Object.entries(value)) {
    // A link field (e.g. a campaign's watch link) is a nullable URL in the
    // schema - "" isn't a valid URL, so blanking it must mean null, not "".
    result[key] =
      key === "id"
        ? crypto.randomUUID()
        : key === "href" && typeof entry === "string"
          ? null
          : emptyFromTemplate(entry, [...path, key]);
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

/* A fresh copy of an entry: same shape and words, but its own identity, so
   duplicating a project cannot make two cards fight over one id. */
function withFreshIds(value: EditorValue): EditorValue {
  if (Array.isArray(value)) return value.map(withFreshIds);
  if (isEditorObject(value)) {
    const result: EditorObject = {};
    for (const [key, entry] of Object.entries(value)) {
      result[key] = key === "id" ? crypto.randomUUID() : withFreshIds(entry);
    }
    return result;
  }
  return value;
}

function blankTestimonial(): EditorObject {
  return {
    id: crypto.randomUUID(),
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
    video: null,
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

/* A new entry for a list. Entries with a fixed shape get a purpose-built blank;
   anything else copies the shape - never the words - of an entry that already
   exists, falling back to the last saved draft when the list was emptied. */
function blankItem(
  path: readonly (string | number)[],
  template: EditorValue | undefined,
): EditorValue | undefined {
  switch (String(path.at(-1) ?? "")) {
    case "projects":
      return blankWorkProject();
    case "cards":
      return blankRoomPicture();
    case "quotes":
      return blankTestimonial();
    default:
      return template === undefined ? undefined : emptyFromTemplate(template, path);
  }
}

function SortableRow({ id, children }: Readonly<{ id: string; children: React.ReactNode }>) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <li
      className={`studio-ins-item${isDragging ? " is-dragging" : ""}`}
      ref={setNodeRef}
      style={style}
    >
      <button
        className="studio-ins-item__grip"
        type="button"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        <span aria-hidden="true">::</span>
      </button>
      {children}
    </li>
  );
}

type ValueEditorProps = Readonly<{
  value: EditorValue;
  label: string;
  path: readonly (string | number)[];
  onChange: (path: readonly (string | number)[], value: EditorValue) => void;
  uploadEnabled: boolean;
}>;

/* Field guidance is written long so nothing is ambiguous, but a wall of it under
   every input buries the inputs themselves. Only the opening sentence stays on
   screen; the rest waits behind a toggle. The scan skips a full stop inside an
   ellipsis so addresses like "youtu.be/..." do not split a sentence in half. */
function splitHint(hint: string): Readonly<{ lead: string; rest: string }> {
  for (let i = 20; i < hint.length - 1; i += 1) {
    if (hint[i] !== "." || hint[i - 1] === "." || !/\s/.test(hint[i + 1] ?? "")) continue;
    const rest = hint.slice(i + 1).trim();
    if (rest.length < 24) break;
    return { lead: hint.slice(0, i + 1), rest };
  }
  return { lead: hint, rest: "" };
}

function FieldHint({
  id,
  hint,
  className = "studio-field__hint",
}: Readonly<{ id: string; hint?: string; className?: string }>) {
  if (!hint) return null;
  const { lead, rest } = splitHint(hint);
  return (
    <div className={className} id={id}>
      {lead}
      {rest ? (
        <details className="studio-hint-more">
          <summary>More detail</summary>
          <span>{rest}</span>
        </details>
      ) : null}
    </div>
  );
}

function ScalarEditor({ value, label, path, onChange }: ValueEditorProps) {
  const key = String(path[path.length - 1] ?? "");
  const options = optionsForPath(path);
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
  // Every media field here sits directly on an object inside an array, so the array's own
  // key - not any ancestor segment - is what tells one field's array apart from another's.
  const arrayKey = path[path.length - 3];
  if (key === "bgVideo" && isEditorObject(value)) {
    return { endpoint: "heroVideo", acceptsAlt: false, isVideo: true };
  }
  if (key === "portraitVideo" && (value === null || isEditorObject(value))) {
    return { endpoint: "heroVideo", acceptsAlt: false, isVideo: true, isOptional: true };
  }
  /* A reel that lives nowhere public can be uploaded to a work project or a
     pinboard card instead of linked. Same field on both boards. */
  if (
    key === "video" &&
    (arrayKey === "projects" || arrayKey === "cards") &&
    (value === null || isEditorObject(value))
  ) {
    return { endpoint: "reelVideo", acceptsAlt: false, isVideo: true, isOptional: true };
  }
  if (key === "portrait" && (value === null || isEditorObject(value))) {
    return { endpoint: "portrait", acceptsAlt: true };
  }
  if (key === "ogImage" && (value === null || isEditorObject(value))) {
    return { endpoint: "ogImage", acceptsAlt: false };
  }
  if (key === "fallbackImage" && (value === null || isEditorObject(value))) {
    return { endpoint: "fallbackImage", acceptsAlt: false, isOptional: true };
  }
  if (key === "image" && (value === null || isEditorObject(value))) {
    const endpoint =
      arrayKey === "roles"
        ? "experienceImage"
        : arrayKey === "slots"
          ? "boothImage"
          : arrayKey === "projects"
            ? "reelCover"
            : arrayKey === "worked"
              ? "collaboratorImage"
              : "roomImage";
    return {
      endpoint,
      acceptsAlt: true,
      // A YouTube link brings its own still, so a cover here is a deliberate
      // override rather than something every project has to fill in. A
      // collaborator portrait is the same kind of optional: the credit
      // stands on its own until a real photo is uploaded.
      isOptional: arrayKey === "projects" || arrayKey === "worked",
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
    (path.includes("projects") || path.includes("cards")) &&
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
      <FieldHint
        id={`studio-${path.join("-")}-field-hint`}
        className="studio-media-field__hint"
        hint={
          hint ??
          (kind === "video"
            ? "A video that plays in this part of the page."
            : "An image that appears in this part of the page.")
        }
      />
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

/* The counterpart to MediaEditor for a project that lives on someone else's
   site - a YouTube video or a LinkedIn post: same card shape and Video badge,
   but the address itself is the asset, so it gets a live thumbnail where one
   exists, a way to replace it, and a way to clear it. */
function LinkEditor({
  value,
  label,
  path,
  onChange,
  showBreadcrumb,
}: ValueEditorProps & { showBreadcrumb?: boolean }) {
  const url = typeof value === "string" ? value : "";
  const reel = resolveReel({ href: url || null });
  // A fetched thumbnail can fail where a computed YouTube one never does.
  // Tracked against the url it failed for, so pasting a new address over a
  // broken one gets a fresh attempt.
  const [failedThumbUrl, setFailedThumbUrl] = useState<string | null>(null);
  const thumbnail = reel.thumbnailCanFail && failedThumbUrl === url ? null : reel.thumbnail;
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
      <FieldHint id={`${inputId}-field-hint`} className="studio-media-field__hint" hint={hint} />
      <div className="studio-link-field__preview">
        {reel.playable ? (
          <MediaPreview
            label={label}
            source={{
              kind: "embed",
              thumbnail,
              embed: reel.embed,
              href: url,
              alt: `Preview of the linked ${reelSourceLabel(reel.kind).toLocaleLowerCase()}`,
            }}
            onError={reel.thumbnailCanFail ? () => setFailedThumbUrl(url) : undefined}
          />
        ) : (
          <p>
            {url
              ? "That is not a YouTube, Instagram or LinkedIn address, so there is no thumbnail and no in-page player. The link still opens from the pop-up."
              : "No link yet. Paste a YouTube, Instagram or LinkedIn address below and its preview appears here."}
          </p>
        )}
      </div>
      <label className="studio-field" htmlFor={inputId}>
        <span>{url ? "Change the link" : "Paste the YouTube, Instagram or LinkedIn link"}</span>
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
          hint="Paste a new address over the old one to swap the reel. A YouTube video, an Instagram reel and a LinkedIn post all bring their own thumbnail; the card and the pop-up follow it straight away."
        />
      </label>
      {reel.thumbnailCanFail ? (
        <p className="studio-media-field__spec">
          {reelSourceLabel(reel.kind)}s publish no still at an address we can look up, so this one
          is fetched and may not arrive. Upload a <b>Cover photo</b> below and the card uses that
          instead - the way a YouTube link supplies its own.
        </p>
      ) : null}
      <div className="studio-link-field__actions">
        {url ? (
          <a href={url} target="_blank" rel="noreferrer">
            Open the link to check it <span aria-hidden="true">&#8599;</span>
          </a>
        ) : null}
        {reel.kind === "none" ? null : <em>{reelSourceLabel(reel.kind)}</em>}
        {url ? (
          <button type="button" onClick={() => onChange(path, null)}>
            Clear link
          </button>
        ) : null}
      </div>
    </fieldset>
  );
}

/* ---------------------------------------------------------------------------
   The panel on the right shows one level at a time: a list of plain-language
   rows, and a trail back to where you came from. Lists of entries - projects,
   polaroids, testimonials - are managed as rows you can add to, copy and delete,
   and you step into an entry to edit its own fields.
--------------------------------------------------------------------------- */

type InspectorViewProps = Readonly<{
  path: readonly (string | number)[];
  onChange: (path: readonly (string | number)[], value: EditorValue) => void;
  onNavigate: (path: readonly (string | number)[]) => void;
  templateFor: (path: readonly (string | number)[]) => EditorValue | undefined;
  uploadEnabled: boolean;
  focusKey: string | null;
}>;

function itemNounFor(path: readonly (string | number)[]) {
  const doc = describeField(path);
  return doc.itemLabel ?? (doc.label.endsWith("s") ? doc.label.slice(0, -1) : doc.label);
}

/* "4 projects" / "3 fields": what a row leads to, before you open it. */
function contentsLabel(value: EditorValue, path: readonly (string | number)[]) {
  if (Array.isArray(value)) {
    const noun = itemNounFor(path).toLowerCase();
    return `${value.length} ${value.length === 1 ? noun : `${noun}s`}`;
  }
  if (isEditorObject(value)) {
    const count = Object.keys(value).length;
    return `${count} ${count === 1 ? "field" : "fields"}`;
  }
  return "";
}

function GroupView({
  value,
  path,
  onChange,
  onNavigate,
  uploadEnabled,
  focusKey,
}: InspectorViewProps & { value: EditorObject }) {
  const focusRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    focusRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [focusKey]);

  return (
    <div className="studio-ins-fields">
      {Object.entries(value)
        .filter(([key]) => key !== "id")
        .map(([key, entry]) => {
          const childPath = [...path, key];
          const label = fieldLabel(childPath);
          const isFocused = focusKey === key;
          const isLink = isVideoLinkField(entry, childPath);
          const isMedia = getMediaConfig(entry, childPath) !== undefined;

          if (isLink || isMedia) {
            return (
              <div
                className={`studio-ins-field${isFocused ? " is-focused" : ""}`}
                key={key}
                ref={isFocused ? focusRef : undefined}
              >
                {isLink ? (
                  <LinkEditor
                    value={entry}
                    label={label}
                    path={childPath}
                    onChange={onChange}
                    uploadEnabled={uploadEnabled}
                  />
                ) : (
                  <MediaEditor
                    value={entry}
                    label={label}
                    path={childPath}
                    onChange={onChange}
                    uploadEnabled={uploadEnabled}
                  />
                )}
              </div>
            );
          }

          if (Array.isArray(entry) || isEditorObject(entry)) {
            const { hint } = describeField(childPath);
            return (
              <button
                className="studio-ins-nav"
                type="button"
                key={key}
                onClick={() => onNavigate(childPath)}
              >
                <span className="studio-ins-nav__text">
                  <b>{label}</b>
                  <small>{hint ?? "Open this to edit what is inside."}</small>
                </span>
                <span className="studio-ins-nav__count">{contentsLabel(entry, childPath)}</span>
                <i aria-hidden="true">&#8250;</i>
              </button>
            );
          }

          return (
            <div
              className={`studio-ins-field${isFocused ? " is-focused" : ""}`}
              key={key}
              ref={isFocused ? focusRef : undefined}
            >
              <ScalarEditor
                value={entry}
                label={label}
                path={childPath}
                onChange={onChange}
                uploadEnabled={uploadEnabled}
              />
            </div>
          );
        })}
    </div>
  );
}

function ListView({
  value,
  path,
  onChange,
  onNavigate,
  templateFor,
  focusKey,
}: InspectorViewProps & { value: EditorValue[] }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const [confirmIndex, setConfirmIndex] = useState<number | null>(null);
  const doc = describeField(path);
  const itemNoun = itemNounFor(path);
  const noun = itemNoun.toLowerCase();
  const template = templateFor(path);
  const nextItem = blankItem(path, template);
  const isTextList =
    value.every((item) => typeof item === "string") &&
    (value.length > 0 || typeof template === "string");
  const itemOptions = optionsForPath([...path, 0]);
  /* The six tiles on an Instagram card are a fixed set the schema counts, so the
     panel lets you recolour them but not add a seventh or drop one. */
  const isFixedLength = path.at(-1) === "tiles";
  const sortableIds = value.flatMap((item) =>
    isEditorObject(item) && typeof item.id === "string" ? [item.id] : [],
  );
  const isSortable = !isTextList && sortableIds.length === value.length && value.length > 1;

  const addItem = () => {
    if (nextItem === undefined) return;
    onChange(path, [...value, nextItem]);
    if (!isTextList) onNavigate([...path, value.length]);
  };

  const copyItem = (index: number) => {
    const item = value[index];
    if (item === undefined) return;
    onChange(path, [...value.slice(0, index + 1), withFreshIds(item), ...value.slice(index + 1)]);
  };

  const deleteItem = (index: number) => {
    setConfirmIndex(null);
    onChange(
      path,
      value.filter((_, position) => position !== index),
    );
  };

  const rows = value.map((item, index) => {
    const title = itemTitle(item, `${itemNoun} ${index + 1}`);
    const summary = mediaSummary(item, [...path, index]);
    const key = isEditorObject(item) && typeof item.id === "string" ? item.id : `${noun}-${index}`;

    const body =
      confirmIndex === index ? (
        <div className="studio-ins-confirm">
          <p>
            Delete <b>{typeof item === "string" ? item || `${itemNoun} ${index + 1}` : title}</b>?
          </p>
          <div>
            <button
              className="studio-ins-btn studio-ins-btn--danger"
              type="button"
              onClick={() => deleteItem(index)}
            >
              Yes, delete
            </button>
            <button className="studio-ins-btn" type="button" onClick={() => setConfirmIndex(null)}>
              Keep it
            </button>
          </div>
        </div>
      ) : isTextList ? (
        <>
          {itemOptions ? (
            <select
              className="studio-ins-item__input"
              value={String(item)}
              aria-label={`${itemNoun} ${index + 1}`}
              onChange={(event) => onChange([...path, index], event.target.value)}
            >
              {itemOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          ) : (
            <input
              className="studio-ins-item__input"
              value={String(item)}
              aria-label={`${itemNoun} ${index + 1}`}
              onChange={(event) => onChange([...path, index], event.target.value)}
            />
          )}
          {isFixedLength ? null : (
            <button
              className="studio-ins-tool studio-ins-tool--danger"
              type="button"
              aria-label={`Delete ${noun} ${index + 1}`}
              onClick={() => setConfirmIndex(index)}
            >
              Delete
            </button>
          )}
        </>
      ) : (
        <>
          <button
            className="studio-ins-item__open"
            type="button"
            onClick={() => onNavigate([...path, index])}
          >
            <span className="studio-ins-item__text">
              <b>{title}</b>
              <small>
                {`${itemNoun} ${index + 1}`}
                {summary === "Text only" ? "" : ` · ${summary}`}
              </small>
            </span>
            <i aria-hidden="true">&#8250;</i>
          </button>
          <div className="studio-ins-item__tools">
            <button
              className="studio-ins-tool"
              type="button"
              aria-label={`Duplicate ${noun} ${index + 1}`}
              onClick={() => copyItem(index)}
            >
              Duplicate
            </button>
            <button
              className="studio-ins-tool studio-ins-tool--danger"
              type="button"
              aria-label={`Delete ${noun} ${index + 1}`}
              onClick={() => setConfirmIndex(index)}
            >
              Delete
            </button>
          </div>
        </>
      );

    if (isSortable && isEditorObject(item) && typeof item.id === "string") {
      return (
        <SortableRow key={key} id={item.id}>
          {body}
        </SortableRow>
      );
    }

    return (
      <li
        className={`studio-ins-item${isTextList ? " studio-ins-item--text" : ""}${
          focusKey === String(index) ? " is-focused" : ""
        }`}
        key={key}
      >
        {body}
      </li>
    );
  });

  return (
    <div className="studio-ins-collection">
      {doc.hint ? <p className="studio-ins-note">{doc.hint}</p> : null}
      {isSortable ? (
        <p className="studio-ins-note studio-ins-note--quiet">
          Drag the <b>::</b> handle to change the order these appear in on the page.
        </p>
      ) : null}
      {value.length > 0 ? (
        <ol className="studio-ins-list">
          {isSortable ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={(event: DragEndEvent) => {
                if (!event.over || event.active.id === event.over.id) return;
                onChange(path, reorder(value, String(event.active.id), String(event.over.id)));
              }}
            >
              <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
                {rows}
              </SortableContext>
            </DndContext>
          ) : (
            rows
          )}
        </ol>
      ) : (
        <p className="studio-ins-empty">
          Nothing here yet. Add the first {noun} and it appears in the preview on the left.
        </p>
      )}
      {isFixedLength ? (
        <p className="studio-ins-note studio-ins-note--quiet">
          This grid always holds {value.length} tiles. Change their colours above; they cannot be
          added to or removed.
        </p>
      ) : nextItem === undefined ? (
        <p className="studio-ins-note studio-ins-note--quiet">
          New entries here copy the shape of an existing one, and there is none left to copy.
        </p>
      ) : (
        <button className="studio-ins-add" type="button" onClick={addItem}>
          <span aria-hidden="true">+</span> Add {noun}
        </button>
      )}
    </div>
  );
}

/* Duplicate and delete for the entry you are currently inside, so you never have
   to step back out to the list to get rid of it. */
function ItemActions({
  data,
  path,
  onChange,
  onNavigate,
}: Readonly<{
  data: EditorObject;
  path: readonly (string | number)[];
  onChange: (path: readonly (string | number)[], value: EditorValue) => void;
  onNavigate: (path: readonly (string | number)[]) => void;
}>) {
  const [confirming, setConfirming] = useState(false);
  const index = path.at(-1);
  const parentPath = path.slice(0, -1);
  const parent = valueAtPath(data, parentPath);

  if (typeof index !== "number" || !Array.isArray(parent)) return null;

  const noun = itemNounFor(parentPath).toLowerCase();
  const item = parent[index];

  if (confirming)
    return (
      <div className="studio-ins-item-actions">
        <div className="studio-ins-confirm">
          <p>Delete this {noun}? It leaves the live page the next time you publish.</p>
          <div>
            <button
              className="studio-ins-btn studio-ins-btn--danger"
              type="button"
              onClick={() => {
                onChange(
                  parentPath,
                  parent.filter((_, position) => position !== index),
                );
                onNavigate(parentPath);
              }}
            >
              Yes, delete
            </button>
            <button className="studio-ins-btn" type="button" onClick={() => setConfirming(false)}>
              Keep it
            </button>
          </div>
        </div>
      </div>
    );

  return (
    <div className="studio-ins-item-actions">
      <button
        className="studio-ins-btn"
        type="button"
        onClick={() => {
          if (item === undefined) return;
          onChange(parentPath, [
            ...parent.slice(0, index + 1),
            withFreshIds(item),
            ...parent.slice(index + 1),
          ]);
          onNavigate([...parentPath, index + 1]);
        }}
      >
        Duplicate this {noun}
      </button>
      <button
        className="studio-ins-btn studio-ins-btn--danger"
        type="button"
        onClick={() => setConfirming(true)}
      >
        Delete this {noun}
      </button>
    </div>
  );
}

function InspectorBody({
  data,
  path,
  onChange,
  onNavigate,
  templateFor,
  uploadEnabled,
  focusKey,
}: InspectorViewProps & { data: EditorObject }) {
  const value = path.length === 0 ? data : valueAtPath(data, path);
  if (value === undefined) return null;

  const label = fieldLabel(path);
  const shared = { path, onChange, onNavigate, templateFor, uploadEnabled, focusKey };

  if (Array.isArray(value)) return <ListView value={value} {...shared} />;

  if (isVideoLinkField(value, path))
    return (
      <div className="studio-ins-fields">
        <LinkEditor
          value={value}
          label={label}
          path={path}
          onChange={onChange}
          uploadEnabled={uploadEnabled}
        />
      </div>
    );

  if (getMediaConfig(value, path))
    return (
      <div className="studio-ins-fields">
        <MediaEditor
          value={value}
          label={label}
          path={path}
          onChange={onChange}
          uploadEnabled={uploadEnabled}
        />
      </div>
    );

  if (isEditorObject(value))
    return (
      <>
        <GroupView value={value} {...shared} />
        <ItemActions data={data} path={path} onChange={onChange} onNavigate={onNavigate} />
      </>
    );

  return (
    <div className="studio-ins-fields">
      <div className="studio-ins-field">
        <ScalarEditor
          value={value}
          label={label}
          path={path}
          onChange={onChange}
          uploadEnabled={uploadEnabled}
        />
      </div>
    </div>
  );
}

type SectionEditorProps = Readonly<{
  section: SectionKey;
  data: unknown;
  version: string | null;
  uploadEnabled: boolean;
  contactData: unknown;
  settingsData: unknown;
}>;

export function SectionEditor({
  section,
  data,
  version,
  uploadEnabled,
  contactData,
  settingsData,
}: SectionEditorProps) {
  const router = useRouter();
  const [savedData, setSavedData] = useState(() => normalizeObject(data));
  const [currentData, setCurrentData] = useState(() => normalizeObject(data));
  const currentDataRef = useRef(currentData);
  /* The draft version this editor is working from. Held in a ref because a save
     has to send the version as it stands at that moment, and because the refresh
     that follows a save re-renders this component without remounting it - the
     `version` prop would still be the one the page first loaded. */
  const versionRef = useRef(version);
  const [activePath, setActivePath] = useState<readonly (string | number)[]>([]);
  const [focusKey, setFocusKey] = useState<string | null>(null);
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
      /* Changing a drawing-room card's type rewrites the whole card rather than
         one field, so the card never sits half in one shape and half in another. */
      const nextData =
        isRoomCardTypePath(path) && typeof value === "string"
          ? updateAtPath(
              currentDataRef.current,
              path.slice(0, -1),
              retypeRoomCard(valueAtPath(currentDataRef.current, path.slice(0, -1)) ?? null, value),
            )
          : updateAtPath(currentDataRef.current, path, value);
      currentDataRef.current = nextData;
      setCurrentData(nextData);
      setValue("data", nextData, {
        shouldDirty: true,
      });
    },
    [setValue],
  );

  const openPath = useCallback((path: readonly (string | number)[]) => {
    setActivePath(path);
    setFocusKey(null);
  }, []);

  /* A new list entry copies the shape of one that already exists. When the list
     has been emptied, the last saved draft still remembers that shape. */
  const templateFor = useCallback(
    (path: readonly (string | number)[]) => {
      const current = valueAtPath(currentData, path);
      if (Array.isArray(current) && current[0] !== undefined) return current[0];
      const saved = valueAtPath(savedData, path);
      if (Array.isArray(saved) && saved[0] !== undefined) return saved[0];
      return undefined;
    },
    [currentData, savedData],
  );

  const handleSave = useCallback(async () => {
    let saved = false;
    await handleSubmit(
      async (values) => {
        const result = await saveDraft(section, values.data, versionRef.current);
        if (!result.ok) {
          pushToast(result.error, "error");
          return;
        }
        versionRef.current = result.version;
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

  /* A draft lives in this component until it is saved, so closing the tab or
     hitting reload throws it away. The browser's own guard is the only one that
     can catch that. */
  useEffect(() => {
    if (!formState.isDirty) return;

    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [formState.isDirty]);

  const selectedPath =
    activePath.length === 0 || valueAtPath(currentData, activePath) !== undefined ? activePath : [];
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
            <strong>Pick what to change.</strong> Click any text in the preview on the left and the
            panel opens it, or work down the <em>Content</em> list on the right.
          </span>
        </li>
        <li>
          <b>2</b>
          <span>
            <strong>Add, copy or delete entries.</strong> Rows with an arrow open a list. Use
            <em>Add</em> for a new one, <em>Duplicate</em> to copy an existing one, and
            <em>Delete</em> to remove it. Every upload sits together under{" "}
            <em>Photos &amp; video</em>.
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
              setActivePath(path.slice(0, -1));
              setFocusKey(String(path.at(-1)));
              setInspectorTab("content");
            }}
          >
            <StudioLandingPreview
              section={section}
              data={previewData}
              contactData={contactData}
              settingsData={settingsData}
            />
          </div>
        </section>
        <aside className="studio-ins" aria-label="Editing panel">
          <header className="studio-ins__head">
            <div>
              <span>Editing</span>
              <h2>{studioSectionLabels[section]}</h2>
            </div>
            <div className="studio-ins__tabs" role="tablist" aria-label="Panel view">
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
          </header>
          {inspectorTab === "media" && assetCount > 0 ? (
            <div className="studio-ins__body studio-ins-media">
              <p className="studio-ins-note">
                Every photo and video this section uses, in one place. Uploads say the file size
                they accept; video links are YouTube addresses you paste. Nothing reaches the live
                site until you save and publish.
              </p>
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
          ) : (
            <>
              <nav className="studio-ins__trail" aria-label="Where you are">
                <button
                  className="studio-ins__back"
                  type="button"
                  disabled={selectedPath.length === 0}
                  onClick={() => openPath(selectedPath.slice(0, -1))}
                >
                  <span aria-hidden="true">&#8249;</span> Back
                </button>
                <ol>
                  <li>
                    <button
                      type="button"
                      onClick={() => openPath([])}
                      disabled={selectedPath.length === 0}
                    >
                      All fields
                    </button>
                  </li>
                  {selectedPath.map((_, index) => {
                    const crumbPath = selectedPath.slice(0, index + 1);
                    const isCurrent = index === selectedPath.length - 1;
                    return (
                      <li key={crumbPath.join("-")}>
                        <button
                          type="button"
                          onClick={() => openPath(crumbPath)}
                          disabled={isCurrent}
                          aria-current={isCurrent ? "step" : undefined}
                        >
                          {fieldLabel(crumbPath)}
                        </button>
                      </li>
                    );
                  })}
                </ol>
              </nav>
              <div className="studio-ins__body">
                <div className="studio-ins__title">
                  <h3>
                    {selectedPath.length === 0
                      ? "Everything in this section"
                      : fieldLabel(selectedPath)}
                  </h3>
                  <p>
                    {selectedPath.length === 0
                      ? "Type in any box to change the words. A row with an arrow opens a list you can add to, reorder or delete from."
                      : (describeField(selectedPath).hint ??
                        "The preview on the left updates as you type.")}
                  </p>
                </div>
                <InspectorBody
                  data={currentData}
                  path={selectedPath}
                  onChange={updateValue}
                  onNavigate={openPath}
                  templateFor={templateFor}
                  uploadEnabled={uploadEnabled}
                  focusKey={focusKey}
                />
              </div>
            </>
          )}
          <SaveBar />
        </aside>
      </div>
      {section === "settings" ? <SettingsDangerZone /> : null}
    </section>
  );
}
