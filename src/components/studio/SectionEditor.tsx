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
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Crosshair,
  ExternalLink,
  GripVertical,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useCallback, useDeferredValue, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { saveDraft } from "@/actions/save-draft";
import { Dropzone, type UploadEndpoint } from "@/components/studio/Dropzone";
import { MediaPreview } from "@/components/studio/MediaPreview";
import { PreviewFit } from "@/components/studio/PreviewFit";
import { PreviewFrame } from "@/components/studio/PreviewFrame";
import { SaveBar } from "@/components/studio/SaveBar";
import { StudioIcon } from "@/components/studio/StudioIcon";
import { StudioLandingPreview } from "@/components/studio/StudioLandingPreview";
import { orderAllProjects } from "@/components/public/WorkConsole";
import { WorkSchema } from "@/schemas";
import { maxAtPath } from "@/lib/field-limits";
import { estimateFocalPoint } from "@/lib/focal-point";
import { isPlaceholderImageSrc } from "@/lib/placeholders";
import { sectionSchemas } from "@/lib/section-schemas";
import type { SectionKey } from "@/lib/sections";
import {
  describeField,
  fieldLabel,
  mediaSpecs,
  sectionDocs,
  type MediaKindLabel,
} from "@/lib/studio-labels";
import { studioSectionLabels, studioTabFor } from "@/lib/studio-nav";
import { reelSourceLabel, resolveReel } from "@/lib/reel";
import { useStudioStore, useUploadBlock } from "@/stores/studio-store";

type EditorValue = string | number | boolean | null | EditorObject | EditorValue[];
type EditorObject = { [key: string]: EditorValue };

const roomTints = ["rg1", "rg2", "rg3", "rg4", "rg5", "rg6"] as const;

const selectOptions: Record<string, readonly string[]> = {
  layout: ["canvas", "grid"],
  hrefLabel: ["", "YouTube", "LinkedIn"],
  logoHint: ["l-jar", "l-onep", "l-ulc", "l-hb", "custom"],
  pinType: ["pin", "pin-signal", "tape", "none"],
  thumbHint: ["bd-1", "bd-2", "bd-3", "bd-4"],
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

/* A click on a work card in the admin preview names its lane and project id,
   not a path - the card has no idea it is being edited. This walks the lanes
   to find the one entry that matches, so the click can jump straight to it. */
function findWorkProjectPath(
  data: EditorObject,
  laneLabel: string,
  projectId: string,
): (string | number)[] | null {
  const lanes = data.lanes;
  if (!Array.isArray(lanes)) return null;

  for (let laneIndex = 0; laneIndex < lanes.length; laneIndex += 1) {
    const lane = lanes[laneIndex];
    if (lane === undefined || !isEditorObject(lane) || lane.label !== laneLabel) continue;
    const projects = lane.projects;
    if (!Array.isArray(projects)) continue;

    for (let projectIndex = 0; projectIndex < projects.length; projectIndex += 1) {
      const project = projects[projectIndex];
      if (project !== undefined && isEditorObject(project) && project.id === projectId) {
        return ["lanes", laneIndex, "projects", projectIndex];
      }
    }
  }

  return null;
}

function normalizePreviewText(value: string) {
  return value.replace(/\s+/g, " ").trim().toLocaleLowerCase();
}

/* Realm-independent stand-in for an `instanceof HTMLElement` check, so a click
   arriving from the mobile preview's frame counts as an element too. */
function asElement(value: unknown): HTMLElement | null {
  return value !== null && typeof value === "object" && (value as Node).nodeType === 1
    ? (value as HTMLElement)
    : null;
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
        : key === "position"
          ? null
          : key === "href" && typeof entry === "string"
            ? null
            : emptyFromTemplate(entry, [...path, key]);
  }
  return result;
}

function itemTitle(value: EditorValue, fallback: string) {
  if (!isEditorObject(value)) return fallback;

  for (const key of ["title", "name", "company", "label", "caption", "kicker"]) {
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
    case "clients":
      return { name: "", logo: null };
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
        <GripVertical aria-hidden="true" />
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
    // "e.g." and "i.e." carry a full stop of their own that ends nothing.
    if (/\b(e\.g|i\.e)$/.test(hint.slice(0, i))) continue;
    const rest = hint.slice(i + 1).trim();
    if (rest.length < 24) break;
    return { lead: hint.slice(0, i + 1), rest };
  }
  return { lead: hint, rest: "" };
}

function FieldHint({ id, hint }: Readonly<{ id: string; hint?: string }>) {
  if (!hint) return null;
  const { lead, rest } = splitHint(hint);
  return (
    <div className="studio-ins-hint" id={id}>
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

function isMultiline(text: string, key: string) {
  return (
    text.length > 74 ||
    /description|approach|paragraph|quote|headline|sub|intro|tagline|text/i.test(key)
  );
}

/* A folded field: what it is and what it holds, with its editor one click away.
   An empty one says "Add" instead, so what a section can still take shows at a
   glance without every box being open. */
function FieldRow({
  label,
  value,
  thumbnail,
  isEmpty,
  leadsOn,
  onClick,
}: Readonly<{
  label: string;
  value: string;
  thumbnail?: string;
  isEmpty: boolean;
  /** Opens a list or group rather than an editor. */
  leadsOn?: boolean;
  onClick: () => void;
}>) {
  if (isEmpty) {
    return (
      <button
        className="studio-ins-row studio-ins-row--empty"
        type="button"
        aria-label={`Add ${label}`}
        onClick={onClick}
      >
        <span className="studio-ins-row__text">
          <b>{label}</b>
        </span>
        <em>Add</em>
      </button>
    );
  }

  return (
    <button className="studio-ins-row" type="button" onClick={onClick}>
      {thumbnail ? (
        <span className="studio-ins-row__icon" aria-hidden="true">
          {/* An address the editor typed, so it cannot go through next/image. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={thumbnail} alt="" />
        </span>
      ) : null}
      <span className="studio-ins-row__text">
        <small>{label}</small>
        <b>{value}</b>
      </span>
      {leadsOn ? (
        <ChevronRight className="studio-ins-row__cue" aria-hidden="true" />
      ) : (
        <Pencil className="studio-ins-row__cue" aria-hidden="true" />
      )}
    </button>
  );
}

/* The one field being edited: its name, what it does on the page, the control,
   and its limit beside the way out. */
function FieldCard({
  label,
  optional,
  hint,
  hintId,
  meta,
  onDone,
  children,
}: Readonly<{
  label: string;
  optional?: boolean;
  hint?: string;
  hintId: string;
  meta?: React.ReactNode;
  onDone: () => void;
  children: React.ReactNode;
}>) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    ref.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, []);

  return (
    <section className="studio-ins-card" ref={ref} aria-label={label}>
      <header>
        <h4>{label}</h4>
        {optional ? <em>Optional</em> : null}
      </header>
      <FieldHint id={hintId} hint={hint} />
      {children}
      <footer>
        <span className="studio-ins-card__meta">{meta}</span>
        <button className="studio-ins-btn studio-ins-btn--primary" type="button" onClick={onDone}>
          Done
        </button>
      </footer>
    </section>
  );
}

type ControlRowProps = Readonly<{ id: string; label: string; hint?: string }>;

/* A switch or a short choice is one click either way, so it is used right in its
   row instead of being opened first. */
function SwitchRow({
  id,
  label,
  hint,
  checked,
  onChange,
}: ControlRowProps & Readonly<{ checked: boolean; onChange: (checked: boolean) => void }>) {
  return (
    <label className="studio-ins-row studio-ins-row--control" htmlFor={id}>
      <span className="studio-ins-row__text">
        <b>{label}</b>
        {hint ? <small>{splitHint(hint).lead}</small> : null}
      </span>
      <input
        id={id}
        className="studio-ins-switch"
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}

function SelectRow({
  id,
  label,
  hint,
  value,
  options,
  onChange,
}: ControlRowProps &
  Readonly<{ value: string; options: readonly string[]; onChange: (value: string) => void }>) {
  return (
    <label className="studio-ins-row studio-ins-row--control" htmlFor={id}>
      <span className="studio-ins-row__text">
        <b>{label}</b>
        {hint ? <small>{splitHint(hint).lead}</small> : null}
      </span>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option || "None"}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextEditor({
  value,
  label,
  path,
  onChange,
  max,
}: Pick<ValueEditorProps, "value" | "label" | "path" | "onChange"> & Readonly<{ max?: number }>) {
  const describedBy = `studio-${path.join("-")}-hint`;

  if (typeof value === "number") {
    return (
      <input
        type="number"
        value={value}
        step="any"
        aria-label={label}
        aria-describedby={describedBy}
        autoFocus
        onChange={(event) => onChange(path, Number(event.target.value))}
      />
    );
  }

  const text = typeof value === "string" ? value : "";
  const set = (next: string) => onChange(path, value === null ? next || null : next);

  return isMultiline(text, String(path.at(-1) ?? "")) ? (
    <textarea
      value={text}
      rows={Math.min(6, Math.max(3, Math.ceil(text.length / 44)))}
      maxLength={max}
      aria-label={label}
      aria-describedby={describedBy}
      autoFocus
      onChange={(event) => set(event.target.value)}
    />
  ) : (
    <input
      value={text}
      maxLength={max}
      aria-label={label}
      aria-describedby={describedBy}
      autoFocus
      onChange={(event) => set(event.target.value)}
    />
  );
}

type MediaConfig = Readonly<{
  endpoint: UploadEndpoint;
  acceptsAlt: boolean;
  isVideo?: boolean;
  isDocument?: boolean;
  isOptional?: boolean;
  /** A video whose duotone tint is set on another field. */
  sharesTint?: boolean;
}>;

function mediaKindOf(config: MediaConfig | undefined): MediaKindLabel {
  return config?.isDocument ? "document" : config?.isVideo ? "video" : "photo";
}

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
  // The phone cut takes its tint from the main video, so it has no switch of its own.
  if (key === "bgVideoMobile" && (value === null || isEditorObject(value))) {
    return {
      endpoint: "heroVideo",
      acceptsAlt: false,
      isVideo: true,
      isOptional: true,
      sharesTint: true,
    };
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
  if (key === "logo" && arrayKey === "clients" && (value === null || isEditorObject(value))) {
    return { endpoint: "clientLogo", acceptsAlt: false };
  }
  if (key === "pdf" && (value === null || isEditorObject(value))) {
    return { endpoint: "resumeFile", acceptsAlt: false, isDocument: true, isOptional: true };
  }
  if (key === "image" && (value === null || isEditorObject(value))) {
    const endpoint =
      arrayKey === "roles"
        ? "experienceImage"
        : arrayKey === "projects"
          ? "reelCover"
          : arrayKey === "worked"
            ? "collaboratorImage"
            : arrayKey === "quotes"
              ? "testimonialImage"
              : "roomImage";
    return {
      endpoint,
      acceptsAlt: true,
      // A YouTube link brings its own still, so a cover here is a deliberate
      // override rather than something every project has to fill in. A
      // collaborator portrait and a testimonial's face are the same kind of
      // optional: the credit stands on its own until a real photo is uploaded.
      isOptional: arrayKey === "projects" || arrayKey === "worked" || arrayKey === "quotes",
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
    document: { total: 0, filled: 0 },
  };

  for (const field of fields) {
    const kind = mediaKindOf(getMediaConfig(field.value, field.path));
    counts[kind].total += 1;
    if (hasMedia(field.value)) counts[kind].filled += 1;
  }

  /* Only what is there is listed: a row reading "no photo yet · no video yet"
     for every optional slot buried the one thing that was set. */
  const parts = (["photo", "video", "document"] as const)
    .filter((kind) => counts[kind].filled > 0)
    .map((kind) => `${counts[kind].filled} ${kind}${counts[kind].filled > 1 ? "s" : ""}`);

  const filledLinks = links.filter((link) => typeof link.value === "string" && link.value).length;
  if (filledLinks > 0) parts.push(filledLinks === 1 ? "video link" : `${filledLinks} video links`);

  return parts.length > 0 ? parts.join(" · ") : "No photo or video yet";
}

function setOptionalString(object: EditorObject, key: string, value: string): EditorObject {
  const next = { ...object };
  if (value) next[key] = value;
  else delete next[key];
  return next;
}

const mediaFallbackHints: Record<MediaKindLabel, string> = {
  photo: "An image that appears in this part of the page.",
  video: "A video that plays in this part of the page.",
  document: "A file visitors can view and download.",
};

/* The address a media field actually shows. A leftover placeholder counts as
   nothing, the same way the page treats it. */
function storedMediaUrl(value: EditorValue) {
  return isEditorObject(value) && typeof value.url === "string" && !isPlaceholderImageSrc(value.url)
    ? value.url
    : "";
}

function MediaEditor({
  value,
  label,
  path,
  onChange,
  uploadEnabled,
  parent,
}: ValueEditorProps & { parent?: EditorObject }) {
  const pushToast = useStudioStore((state) => state.pushToast);
  const config = getMediaConfig(value, path);
  if (!config) return null;

  const kind = mediaKindOf(config);
  const id = `studio-${path.join("-")}`;
  const object = isEditorObject(value) ? value : {};
  const url = typeof object.url === "string" ? object.url : "";
  const alt = typeof object.alt === "string" ? object.alt : "";
  const poster = typeof object.poster === "string" ? object.poster : "";
  const duotone = object.duotone === true;

  const setUrl = (nextUrl: string) => {
    if (!nextUrl && (!config.isVideo || config.isOptional)) {
      onChange(path, null);
      return;
    }
    onChange(path, { ...object, url: nextUrl });
  };

  /* Only the experience reel crops its photos into a
     fixed box - everywhere else an image runs at its own shape. */
  const supportsFocalPoint = config.endpoint === "experienceImage";
  const focalX = typeof parent?.focalX === "number" ? parent.focalX : 0.5;
  const focalY = typeof parent?.focalY === "number" ? parent.focalY : 0.5;
  const parentPath = path.slice(0, -1);
  const setFocal = (x: number, y: number) => {
    onChange([...parentPath, "focalX"], Math.min(1, Math.max(0, x)));
    onChange([...parentPath, "focalY"], Math.min(1, Math.max(0, y)));
  };
  const pickFocalPoint = (event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setFocal((event.clientX - rect.left) / rect.width, (event.clientY - rect.top) / rect.height);
  };
  const autoDetectFocalPoint = async (imageUrl: string) => {
    try {
      const point = await estimateFocalPoint(imageUrl);
      setFocal(point.x, point.y);
    } catch {
      // The focal point already set is left alone - the picker still works by hand.
      pushToast("Couldn't auto-detect the crop focus. Click the photo to set it by hand.", "error");
    }
  };

  return (
    <>
      <Dropzone
        endpoint={config.endpoint}
        label={label}
        value={url || undefined}
        enabled={uploadEnabled}
        onUploaded={(upload) => {
          setUrl(upload.url);
          if (supportsFocalPoint) void autoDetectFocalPoint(upload.url);
        }}
        onRemoved={() => setUrl("")}
      />
      {config.acceptsAlt && url ? (
        <input
          value={alt}
          aria-label="Describe the photo"
          placeholder="Describe the photo, for people who cannot see it"
          onChange={(event) => onChange(path, { ...object, url, alt: event.target.value })}
        />
      ) : null}
      <details className="studio-ins-more">
        <summary>
          More options
          <ChevronDown aria-hidden="true" />
        </summary>
        <label className="studio-ins-sub" htmlFor={`${id}-url`}>
          <span>Use a link instead</span>
          <input
            id={`${id}-url`}
            type="url"
            value={url}
            placeholder="https://"
            onChange={(event) => setUrl(event.target.value)}
          />
          <small>
            For a {kind === "document" ? "file" : kind} that already lives on another site.
            Uploading fills this in for you.
          </small>
        </label>
        {supportsFocalPoint && url ? (
          <div className="studio-ins-sub">
            <span>Crop focus</span>
            <button
              type="button"
              className="studio-focal-picker"
              style={{ backgroundImage: `url(${url})` }}
              onClick={pickFocalPoint}
              aria-label="Click where the crop should centre on this photo"
            >
              <span
                className="studio-focal-picker__marker"
                style={{ left: `${focalX * 100}%`, top: `${focalY * 100}%` }}
                aria-hidden="true"
              />
            </button>
            <div className="studio-drop__actions">
              <button
                className="studio-ins-btn"
                type="button"
                onClick={() => void autoDetectFocalPoint(url)}
              >
                <Crosshair aria-hidden="true" />
                Auto-detect
              </button>
              <button className="studio-ins-btn" type="button" onClick={() => setFocal(0.5, 0.5)}>
                Reset to centre
              </button>
            </div>
            <small>
              Click the part of the photo that matters most, so a narrow tile crops around it
              instead of the middle.
            </small>
          </div>
        ) : null}
        {config.isVideo ? (
          <>
            <div className="studio-ins-sub">
              <span>Poster photo</span>
              <Dropzone
                endpoint="videoPoster"
                label={`${label} poster`}
                value={poster || undefined}
                enabled={uploadEnabled}
                onUploaded={(upload) =>
                  onChange(path, setOptionalString(object, "poster", upload.url))
                }
                onRemoved={() => onChange(path, setOptionalString(object, "poster", ""))}
              />
              <small>
                The still shown while the video loads - ideally its first frame, and small (around
                100KB).
              </small>
            </div>
            {config.sharesTint ? null : (
              <SwitchRow
                id={`${id}-duotone`}
                label="Duotone tint"
                hint="Washes the video in the site's orange-and-black treatment."
                checked={duotone}
                onChange={(checked) => onChange(path, { ...object, duotone: checked })}
              />
            )}
          </>
        ) : null}
      </details>
    </>
  );
}

/* The counterpart to MediaEditor for a project that lives on someone else's
   site - a YouTube video or a LinkedIn post: the address itself is the asset, so
   it gets a live thumbnail where one exists, and a way to clear it. */
function LinkEditor({
  value,
  label,
  path,
  onChange,
}: Pick<ValueEditorProps, "value" | "label" | "path" | "onChange">) {
  const url = typeof value === "string" ? value : "";
  const reel = resolveReel({ href: url || null });
  // A fetched thumbnail can fail where a computed YouTube one never does.
  // Tracked against the url it failed for, so pasting a new address over a
  // broken one gets a fresh attempt.
  const [failedThumbUrl, setFailedThumbUrl] = useState<string | null>(null);
  const thumbnail = reel.thumbnailCanFail && failedThumbUrl === url ? null : reel.thumbnail;

  return (
    <>
      <input
        type="url"
        value={url}
        aria-label={label}
        aria-describedby={`studio-${path.join("-")}-hint`}
        placeholder="Paste a YouTube, Instagram or LinkedIn link"
        autoFocus
        onChange={(event) => onChange(path, event.target.value || null)}
      />
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
      ) : url ? (
        <p className="studio-ins-note">
          That is not a YouTube, Instagram or LinkedIn address, so there is no thumbnail and no
          in-page player. The link still opens from the pop-up.
        </p>
      ) : null}
      {reel.thumbnailCanFail ? (
        <p className="studio-ins-note">
          {reelSourceLabel(reel.kind)}s publish no still we can look up, so this one is fetched and
          may not arrive. Add a cover photo and the card uses that instead.
        </p>
      ) : null}
      {url ? (
        <div className="studio-drop__actions">
          <a className="studio-ins-btn" href={url} target="_blank" rel="noreferrer">
            <ExternalLink aria-hidden="true" />
            Open link
          </a>
          <button className="studio-ins-btn" type="button" onClick={() => onChange(path, null)}>
            <Trash2 aria-hidden="true" />
            Remove link
          </button>
        </div>
      ) : null}
    </>
  );
}

/* ---------------------------------------------------------------------------
   The panel on the right shows one level at a time, and nothing is open until it
   is asked for: every field is a row saying what it holds, or "Add" when it is
   empty, and clicking one opens just that field. Lists of entries - projects,
   polaroids, testimonials - are rows you can add to, copy, reorder and delete,
   and you step into an entry to edit its own fields.
--------------------------------------------------------------------------- */

type InspectorViewProps = Readonly<{
  path: readonly (string | number)[];
  onChange: (path: readonly (string | number)[], value: EditorValue) => void;
  onNavigate: (path: readonly (string | number)[]) => void;
  templateFor: (path: readonly (string | number)[]) => EditorValue | undefined;
  uploadEnabled: boolean;
  /** The field whose editor is open; in a list of words, the entry to point out. */
  openKey: string | null;
  onOpen: (key: string | null) => void;
  /** The most a field may hold: characters for text, entries for a list. */
  maxFor: (path: readonly (string | number)[]) => number | undefined;
}>;

function itemNounFor(path: readonly (string | number)[]) {
  const doc = describeField(path);
  return doc.itemLabel ?? (doc.label.endsWith("s") ? doc.label.slice(0, -1) : doc.label);
}

/* "4 of 20 projects" / "3 fields": what a row leads to, before you open it. */
function contentsLabel(value: EditorValue, path: readonly (string | number)[], max?: number) {
  if (Array.isArray(value)) {
    const noun = itemNounFor(path).toLowerCase();
    const plural = /[^aeiou]y$/.test(noun) ? `${noun.slice(0, -1)}ies` : `${noun}s`;
    if (max !== undefined) return `${value.length} of ${max} ${plural}`;
    return `${value.length} ${value.length === 1 ? noun : plural}`;
  }
  if (isEditorObject(value)) {
    const count = Object.keys(value).length;
    return `${count} ${count === 1 ? "field" : "fields"}`;
  }
  return "";
}

/* Set elsewhere: card positions and the "All work" order by dragging in the
   preview, a photo's crop focus by clicking the photo in its own card, the
   freelance switch on the Studio page. */
const hiddenKeys = new Set([
  "id",
  "position",
  "allOrder",
  "focalX",
  "focalY",
  "availableForFreelance",
]);

function GroupView({
  value,
  path,
  onChange,
  onNavigate,
  uploadEnabled,
  openKey,
  onOpen,
  maxFor,
}: InspectorViewProps & { value: EditorObject }) {
  const entries = Object.entries(value).filter(([key]) => !hiddenKeys.has(key));
  /* At the top of a section the small labels ("Next scene" button text and the
     like) go last, under a caption of their own, so the panel opens on what the
     section is about: its headline, its list of projects. */
  const isWording = ([key]: [string, EditorValue]) => path.length === 0 && key.endsWith("Label");
  const wording = entries.filter(isWording);
  const row = ([key, entry]: [string, EditorValue]) => {
    const childPath = [...path, key];
    const { label, hint } = describeField(childPath);
    const id = `studio-${childPath.join("-")}`;
    const hintId = `${id}-hint`;
    const isOpen = openKey === key;
    const toggle = () => onOpen(isOpen ? null : key);
    const close = () => onOpen(null);

    if (isVideoLinkField(entry, childPath)) {
      const url = typeof entry === "string" ? entry : "";
      if (isOpen) {
        return (
          <FieldCard key={key} label={label} hint={hint} hintId={hintId} onDone={close}>
            <LinkEditor value={entry} label={label} path={childPath} onChange={onChange} />
          </FieldCard>
        );
      }
      const reel = resolveReel({ href: url || null });
      return (
        <FieldRow
          key={key}
          label={label}
          value={`${reelSourceLabel(reel.kind)} · ${url.replace(/^https?:\/\/(www\.)?/, "")}`}
          thumbnail={reel.thumbnailCanFail ? undefined : (reel.thumbnail ?? undefined)}
          isEmpty={!url}
          onClick={toggle}
        />
      );
    }

    const media = getMediaConfig(entry, childPath);
    if (media) {
      const kind = mediaKindOf(media);
      if (isOpen) {
        return (
          <FieldCard
            key={key}
            label={label}
            optional={media.isOptional}
            hint={hint ?? mediaFallbackHints[kind]}
            hintId={hintId}
            onDone={close}
          >
            <MediaEditor
              value={entry}
              label={label}
              path={childPath}
              onChange={onChange}
              uploadEnabled={uploadEnabled}
              parent={value}
            />
          </FieldCard>
        );
      }
      const url = storedMediaUrl(entry);
      return (
        <FieldRow
          key={key}
          label={label}
          value={`${mediaSpecs[kind].badge} added`}
          thumbnail={kind === "photo" && url ? url : undefined}
          isEmpty={!url}
          onClick={toggle}
        />
      );
    }

    if (typeof entry === "boolean") {
      return (
        <SwitchRow
          key={key}
          id={id}
          label={label}
          hint={hint}
          checked={entry}
          onChange={(checked) => onChange(childPath, checked)}
        />
      );
    }

    if (Array.isArray(entry) || isEditorObject(entry)) {
      const isList = Array.isArray(entry);
      return (
        <FieldRow
          key={key}
          label={label}
          value={contentsLabel(entry, childPath, isList ? maxFor(childPath) : undefined)}
          isEmpty={isList && entry.length === 0}
          leadsOn
          onClick={() => onNavigate(childPath)}
        />
      );
    }

    const options = optionsForPath(childPath);
    if (options && (typeof entry === "string" || (entry === null && options.includes("")))) {
      return (
        <SelectRow
          key={key}
          id={id}
          label={label}
          hint={hint}
          value={entry ?? ""}
          options={options}
          onChange={(next) => onChange(childPath, next || null)}
        />
      );
    }

    const text = entry === null ? "" : String(entry);
    const max = typeof entry === "number" ? undefined : maxFor(childPath);
    if (isOpen) {
      return (
        <FieldCard
          key={key}
          label={label}
          hint={hint}
          hintId={hintId}
          meta={
            max === undefined ? null : (
              <span className={text.length >= max * 0.9 ? "is-near" : undefined}>
                {text.length} / {max}
              </span>
            )
          }
          onDone={close}
        >
          <TextEditor value={entry} label={label} path={childPath} onChange={onChange} max={max} />
        </FieldCard>
      );
    }
    return <FieldRow key={key} label={label} value={text} isEmpty={text === ""} onClick={toggle} />;
  };

  return (
    <div className="studio-ins-rows">
      {entries.filter((entry) => !isWording(entry)).map(row)}
      {wording.length > 0 ? <p className="studio-ins-rows__caption">Small labels</p> : null}
      {wording.map(row)}
    </div>
  );
}

function ListView({
  value,
  path,
  onChange,
  onNavigate,
  templateFor,
  openKey,
  maxFor,
}: InspectorViewProps & { value: EditorValue[] }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const [confirmIndex, setConfirmIndex] = useState<number | null>(null);
  const [triedWhenFull, setTriedWhenFull] = useState(false);
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
  const max = maxFor(path);
  const itemMax = maxFor([...path, 0]);
  const isFull = max !== undefined && value.length >= max;
  /* Entries without an id of their own (collaborators, stats) are sorted by
     position instead, so every list of entries can be dragged into order. */
  const sortableIds = value.map((item, index) =>
    isEditorObject(item) && typeof item.id === "string" ? item.id : `row-${index}`,
  );
  const isSortable = !isTextList && value.every(isEditorObject) && value.length > 1;

  const addItem = () => {
    if (nextItem === undefined) return;
    if (isFull) {
      setTriedWhenFull(true);
      return;
    }
    onChange(path, [...value, nextItem]);
    if (!isTextList) onNavigate([...path, value.length]);
  };

  const copyItem = (index: number) => {
    const item = value[index];
    if (item === undefined) return;
    if (isFull) {
      setTriedWhenFull(true);
      return;
    }
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
    /* An entry that holds a list of its own (a category and its projects) is
       summed up by that list; counting every photo inside it reads as noise. */
    const nested = isEditorObject(item)
      ? Object.entries(item).find(([, entry]) => Array.isArray(entry))
      : undefined;
    const summary = nested
      ? contentsLabel(nested[1], [...path, index, nested[0]])
      : mediaSummary(item, [...path, index]);
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
              Delete
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
              maxLength={itemMax}
              aria-label={`${itemNoun} ${index + 1}`}
              onChange={(event) => onChange([...path, index], event.target.value)}
            />
          )}
          {isFixedLength ? null : (
            <button
              className="studio-ins-icon studio-ins-icon--danger"
              type="button"
              aria-label={`Delete ${noun} ${index + 1}`}
              title="Delete"
              onClick={() => setConfirmIndex(index)}
            >
              <Trash2 aria-hidden="true" />
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
            <b>{title}</b>
            <small>{summary === "Text only" ? `${itemNoun} ${index + 1}` : summary}</small>
          </button>
          <button
            className="studio-ins-icon"
            type="button"
            aria-label={`Duplicate ${noun} ${index + 1}`}
            title="Duplicate"
            onClick={() => copyItem(index)}
          >
            <Copy aria-hidden="true" />
          </button>
          <button
            className="studio-ins-icon studio-ins-icon--danger"
            type="button"
            aria-label={`Delete ${noun} ${index + 1}`}
            title="Delete"
            onClick={() => setConfirmIndex(index)}
          >
            <Trash2 aria-hidden="true" />
          </button>
        </>
      );

    if (isSortable) {
      return (
        <SortableRow key={key} id={sortableIds[index]!}>
          {body}
        </SortableRow>
      );
    }

    return (
      <li className={`studio-ins-item${openKey === String(index) ? " is-focused" : ""}`} key={key}>
        {body}
      </li>
    );
  });

  return (
    <div className="studio-ins-collection">
      {value.length > 0 ? (
        <ol className="studio-ins-list">
          {isSortable ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={(event: DragEndEvent) => {
                if (!event.over || event.active.id === event.over.id) return;
                const from = sortableIds.indexOf(String(event.active.id));
                const to = sortableIds.indexOf(String(event.over.id));
                if (from < 0 || to < 0) return;
                onChange(path, arrayMove(value, from, to));
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
          Nothing here yet. Add the first {noun} and it appears in the preview.
        </p>
      )}
      <div className="studio-ins-listfoot">
        <span>
          {value.length}
          {max === undefined ? "" : ` of ${max}`}
          {isSortable ? " · drag the handle to reorder" : ""}
        </span>
        {isFixedLength || nextItem === undefined ? null : (
          <button className="studio-ins-btn" type="button" onClick={addItem}>
            <Plus aria-hidden="true" />
            Add {noun}
          </button>
        )}
      </div>
      {isFull && triedWhenFull ? (
        <p className="studio-ins-note studio-ins-note--warn" role="status">
          This list is full at {max}. Delete one to add another.
        </p>
      ) : null}
      {isFixedLength ? (
        <p className="studio-ins-note">
          This grid always holds {value.length} tiles. Change their colours above; they cannot be
          added to or removed.
        </p>
      ) : nextItem === undefined ? (
        <p className="studio-ins-note">
          New entries here copy the shape of an existing one, and there is none left to copy.
        </p>
      ) : null}
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
  maxFor,
}: Pick<InspectorViewProps, "path" | "onChange" | "onNavigate" | "maxFor"> &
  Readonly<{ data: EditorObject }>) {
  const [confirming, setConfirming] = useState(false);
  const [triedWhenFull, setTriedWhenFull] = useState(false);
  const index = path.at(-1);
  const parentPath = path.slice(0, -1);
  const parent = valueAtPath(data, parentPath);

  if (typeof index !== "number" || !Array.isArray(parent)) return null;

  const noun = itemNounFor(parentPath).toLowerCase();
  const item = parent[index];
  const max = maxFor(parentPath);
  const isFull = max !== undefined && parent.length >= max;

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
              Delete
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
          if (isFull) {
            setTriedWhenFull(true);
            return;
          }
          onChange(parentPath, [
            ...parent.slice(0, index + 1),
            withFreshIds(item),
            ...parent.slice(index + 1),
          ]);
          onNavigate([...parentPath, index + 1]);
        }}
      >
        <Copy aria-hidden="true" />
        Duplicate
      </button>
      <button
        className="studio-ins-btn studio-ins-btn--danger"
        type="button"
        onClick={() => setConfirming(true)}
      >
        <Trash2 aria-hidden="true" />
        Delete {noun}
      </button>
      {isFull && triedWhenFull ? (
        <p className="studio-ins-note studio-ins-note--warn" role="status">
          This list is full at {max}. Delete one to add another.
        </p>
      ) : null}
    </div>
  );
}

function InspectorBody({ data, ...view }: InspectorViewProps & { data: EditorObject }) {
  const value = view.path.length === 0 ? data : valueAtPath(data, view.path);

  if (Array.isArray(value)) return <ListView value={value} {...view} />;
  if (value === undefined || !isEditorObject(value)) return null;

  return (
    <>
      <GroupView value={value} {...view} />
      <ItemActions
        data={data}
        path={view.path}
        onChange={view.onChange}
        onNavigate={view.onNavigate}
        maxFor={view.maxFor}
      />
    </>
  );
}

type SectionEditorProps = Readonly<{
  section: SectionKey;
  data: unknown;
  version: string | null;
  uploadEnabled: boolean;
  contactData: unknown;
  settingsData: unknown;
  /** The draft resume PDF's address, which decides whether the navbar preview shows a Resume link. */
  resumeUrl?: string | null;
  /** Where the panel opens, e.g. `["site", "footer"]`; an unknown path falls back to the top. */
  initialPath?: readonly (string | number)[];
}>;

export function SectionEditor({
  section,
  data,
  version,
  uploadEnabled,
  contactData,
  settingsData,
  resumeUrl,
  initialPath = [],
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
  const markedRef = useRef<Element | null>(null);
  const [activePath, setActivePath] = useState<readonly (string | number)[]>(initialPath);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  /* Until one is picked, the preview shows the whole section when that keeps it
     readable and otherwise fits the width and scrolls. */
  const [previewChoice, setPreviewChoice] = useState<boolean | null>(null);
  const [previewFit, setPreviewFit] = useState({ scale: 1, whole: true });
  const previewWhole = previewFit.whole;
  const { formState, handleSubmit, reset, setValue } = useForm<{ data: unknown }>({
    defaultValues: { data: savedData },
  });
  const markDirty = useStudioStore((state) => state.markDirty);
  const clearDirty = useStudioStore((state) => state.clearDirty);
  const pushToast = useStudioStore((state) => state.pushToast);
  const registerDraftHandlers = useStudioStore((state) => state.registerDraftHandlers);
  const previewData = useDeferredValue(currentData);
  const { blocked: uploadBlocked, label: uploadLabel } = useUploadBlock();
  const schema = sectionSchemas[section];
  const maxFor = (path: readonly (string | number)[]) => maxAtPath(schema, path);

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

  /* Moving the panel unmounts the open card, and an upload card that unmounts
     abandons its upload - so the panel stays where it is until the file lands. */
  const holdForUpload = () => {
    if (!uploadBlocked) return false;
    pushToast(`${uploadLabel ?? "A file"} is still uploading. Wait for it to finish.`, "info");
    return true;
  };

  /* Outlines the piece of the preview that the open field belongs to. Only a click
     on the preview knows which element that is, so moving the panel any other way
     clears the outline rather than leave it on the wrong thing. */
  const markSelected = (node: Element | null) => {
    markedRef.current?.removeAttribute("data-studio-selected");
    node?.setAttribute("data-studio-selected", "");
    markedRef.current = node;
  };

  /* Shows `path` in the panel. The panel only shows groups and lists, so a path
     that ends on something narrower - a photo, a link, a single word - shows its
     parent with that row opened. */
  const showInPanel = (path: readonly (string | number)[]) => {
    if (holdForUpload()) return false;
    markSelected(null);
    let target = path;
    let key: string | null = null;
    while (target.length > 0) {
      const value = valueAtPath(currentData, target);
      if (Array.isArray(value)) break;
      if (value !== undefined && isEditorObject(value) && !getMediaConfig(value, target)) break;
      key = String(target.at(-1));
      target = target.slice(0, -1);
    }
    setActivePath(target);
    setOpenKey(key);
    return true;
  };

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
  /* The tab this editor was opened from names the panel. A tab that owns one part
     of a shared draft (Navbar, Footer, Room entrance) is also where the trail
     starts, and a tab that leaves a part to another (the Room page, whose home-page
     invitation has the Room entrance tab) keeps that part out of its list. */
  const tab = studioTabFor(section, initialPath);
  const panelTitle = tab?.label ?? studioSectionLabels[section];
  const trailBase = initialPath.every((segment, index) => selectedPath[index] === segment)
    ? initialPath.length
    : 0;
  const elsewhere = selectedPath.length === 0 ? tab?.part?.except : undefined;
  const panelData = elsewhere
    ? Object.fromEntries(Object.entries(currentData).filter(([key]) => key !== elsewhere))
    : currentData;
  /* A list entry is named by what it holds ("Jar app launch film"), a group or
     list by its label. */
  const nameAt = (path: readonly (string | number)[]) =>
    typeof path.at(-1) === "number"
      ? itemTitle(valueAtPath(currentData, path) ?? null, fieldLabel(path))
      : fieldLabel(path);

  /* Two drafts are edited from more than one tab, and the preview shows only the
     part the panel is in: where the tab opened it, until it steps into a group.
     The Drawing Room's "Room entrance" tab opens on the teaser group and previews
     the home-page invitation; anywhere else in that draft previews the /room page.
     The site-wide settings preview the navbar or the footer alone on their tabs. */
  const previewPath = selectedPath.length === 0 ? initialPath : selectedPath;
  const roomEntrance = section === "room" && previewPath[0] === "teaser";
  const sitePart = section === "settings" && previewPath[0] === "site" ? previewPath[1] : null;
  const settingsView = sitePart === "navigation" || sitePart === "footer" ? sitePart : "all";
  const previewNote = roomEntrance
    ? describeField(["teaser"]).hint
    : settingsView !== "all"
      ? describeField(["site", settingsView]).hint
      : undefined;

  const preview = (
    <StudioLandingPreview
      section={section}
      data={previewData}
      contactData={contactData}
      settingsData={settingsData}
      roomView={roomEntrance ? "entrance" : "page"}
      settingsView={settingsView}
      resumeUrl={resumeUrl}
      onWorkProjectSelect={(laneLabel, projectId) => {
        const path = findWorkProjectPath(currentData, laneLabel, projectId);
        if (path) showInPanel(path);
      }}
      onWorkProjectMove={(laneLabel, projectId, position) => {
        const path = findWorkProjectPath(currentDataRef.current, laneLabel, projectId);
        if (path) updateValue([...path, "position"], position);
      }}
      onWorkProjectReorder={(laneLabel, fromId, toId) => {
        const parsed = WorkSchema.safeParse(currentDataRef.current);
        if (!parsed.success) return;
        if (laneLabel === null) {
          const ids = orderAllProjects(parsed.data).map(({ project }) => project.id);
          updateValue(["allOrder"], arrayMove(ids, ids.indexOf(fromId), ids.indexOf(toId)));
          return;
        }
        const laneIndex = parsed.data.lanes.findIndex((lane) => lane.label === laneLabel);
        const projects = (currentDataRef.current.lanes as EditorObject[] | undefined)?.[laneIndex]
          ?.projects;
        if (laneIndex < 0 || !Array.isArray(projects)) return;
        const ids = parsed.data.lanes[laneIndex]!.projects.map((project) => project.id);
        updateValue(
          ["lanes", laneIndex, "projects"],
          arrayMove(projects, ids.indexOf(fromId), ids.indexOf(toId)),
        );
      }}
      onCollaboratorSelect={(index) => {
        if (index >= 0) showInPanel(["worked", index]);
      }}
      onCollaboratorMove={(from, to) => {
        const worked = currentDataRef.current.worked;
        if (!Array.isArray(worked)) return;
        updateValue(["worked"], arrayMove(worked, from, to));
      }}
    />
  );

  return (
    <section
      className={`studio-page studio-editor studio-editor--${section}`}
      aria-label={`${studioSectionLabels[section]} editor`}
    >
      <div className="studio-editor__layout">
        <section
          className={`studio-canvas studio-canvas--${previewDevice}`}
          aria-label="Landing-page preview"
        >
          <header className="studio-canvas__topbar">
            <span>{previewNote ?? sectionDocs[section].summary}</span>
            <div className="studio-canvas__tools">
              <output aria-label="Preview zoom">{Math.round(previewFit.scale * 100)}%</output>
              <div className="studio-device-switch" role="group" aria-label="Preview size">
                <button
                  className={previewWhole ? "is-active" : ""}
                  type="button"
                  aria-pressed={previewWhole}
                  title="Show the whole section at once"
                  onClick={() => setPreviewChoice(true)}
                >
                  Fit
                </button>
                <button
                  className={previewWhole ? "" : "is-active"}
                  type="button"
                  aria-pressed={!previewWhole}
                  title="Fill the width and scroll down the section"
                  onClick={() => setPreviewChoice(false)}
                >
                  Full width
                </button>
              </div>
              <div className="studio-device-switch" role="group" aria-label="Preview device">
                <button
                  className={previewDevice === "desktop" ? "is-active" : ""}
                  type="button"
                  aria-label="Desktop"
                  title="Desktop"
                  aria-pressed={previewDevice === "desktop"}
                  onClick={() => setPreviewDevice("desktop")}
                >
                  <StudioIcon name="desktop" />
                </button>
                <button
                  className={previewDevice === "mobile" ? "is-active" : ""}
                  type="button"
                  aria-label="Mobile"
                  title="Mobile"
                  aria-pressed={previewDevice === "mobile"}
                  onClick={() => setPreviewDevice("mobile")}
                >
                  <StudioIcon name="mobile" />
                </button>
              </div>
            </div>
          </header>
          <div
            className={`studio-canvas__viewport studio-canvas__viewport--editable${
              previewWhole ? " studio-canvas__viewport--fit" : ""
            }`}
            onSubmitCapture={(event) => event.preventDefault()}
            onClickCapture={(event) => {
              /* Not `instanceof HTMLElement`: on the mobile preview the click
                 comes from inside the frame's document, whose elements belong
                 to that realm and fail the host's instance check. A node type
                 is the same number in every realm. */
              const target = asElement(event.target);
              if (!target) return;

              /* The preview is a picture of the page, not the page: links never
                 navigate and buttons never run, so a click on either falls
                 through to editing the text it carries. The one exception is
                 controls that are themselves editor hooks (work-board cards,
                 collaborator tiles), marked with data-studio-hooks. */
              if (target.closest("input, select, textarea")) return;

              /* An entry that names its own place in the draft opens directly:
                 two companies can share a name, which matching on text cannot
                 tell apart. Its own click still runs, so a filmstrip thumb
                 switches the scene as well as opening its role. */
              const entry = target.closest<HTMLElement>("[data-studio-path]");
              if (entry) {
                const shown = showInPanel(
                  (entry.dataset.studioPath ?? "")
                    .split(".")
                    .map((segment) => (/^\d+$/.test(segment) ? Number(segment) : segment)),
                );
                if (shown) markSelected(entry);
                return;
              }

              const control = target.closest("a, button");
              if (control?.tagName === "BUTTON" && control.closest("[data-studio-hooks]")) return;
              if (control) {
                event.preventDefault();
                event.stopPropagation();
              }

              const candidates: string[] = [];
              let node: HTMLElement | null = target;
              /* On the mobile preview the walk never meets `currentTarget` -
                 that element lives outside the frame - so the frame's own root
                 ends it, before <body> can offer the whole page as a match. */
              while (node && node !== event.currentTarget && !node.dataset.previewRoot) {
                const text = normalizePreviewText(node.textContent ?? "");
                if (text && !candidates.includes(text)) candidates.push(text);
                node = node.parentElement;
              }

              const path = findPreviewPath(currentData, candidates);
              /* A tab that owns one part of a shared draft (the navbar, the
                 footer, the room entrance) stays on it: the wordmark shows in
                 both bars but belongs to neither, so a click on it there must
                 not carry the panel and the preview off to another part. */
              if (!path || !initialPath.every((segment, index) => path[index] === segment)) return;
              event.preventDefault();
              event.stopPropagation();
              if (showInPanel(path)) {
                markSelected(target.closest("h1, h2, h3, p, blockquote, li, a, button") ?? target);
              }
            }}
          >
            <PreviewFit device={previewDevice} whole={previewChoice} onFit={setPreviewFit}>
              {previewDevice === "mobile" ? (
                <PreviewFrame title="Mobile preview" artboard={section === "room" && !roomEntrance}>
                  {preview}
                </PreviewFrame>
              ) : (
                preview
              )}
            </PreviewFit>
          </div>
        </section>
        <aside className="studio-ins" aria-label="Editing panel">
          <header className="studio-ins__head">
            <div className="studio-ins__headline">
              <div className="studio-ins__title">
                <span>Editing</span>
                <h2>{panelTitle}</h2>
              </div>
              <SaveBar />
            </div>
          </header>
          {selectedPath.length > trailBase ? (
            <nav className="studio-ins__trail" aria-label="Where you are">
              <button
                className="studio-ins-icon"
                type="button"
                aria-label="Back"
                title="Back"
                onClick={() => showInPanel(selectedPath.slice(0, -1))}
              >
                <ChevronLeft aria-hidden="true" />
              </button>
              <ol>
                <li>
                  <button
                    type="button"
                    onClick={() => showInPanel(selectedPath.slice(0, trailBase))}
                  >
                    {panelTitle}
                  </button>
                </li>
                {selectedPath.slice(trailBase).map((_, offset) => {
                  const index = trailBase + offset;
                  const crumbPath = selectedPath.slice(0, index + 1);
                  const isCurrent = index === selectedPath.length - 1;
                  return (
                    <li key={crumbPath.join("-")}>
                      <button
                        type="button"
                        onClick={() => showInPanel(crumbPath)}
                        disabled={isCurrent}
                        aria-current={isCurrent ? "step" : undefined}
                      >
                        {nameAt(crumbPath)}
                      </button>
                    </li>
                  );
                })}
              </ol>
            </nav>
          ) : null}
          <div className="studio-ins__body">
            <p className="studio-ins__lead">
              {selectedPath.length === trailBase
                ? "Click a row to edit it, or click anything on the page to jump straight to it."
                : (describeField(selectedPath).hint ?? "The preview updates as you type.")}
            </p>
            <InspectorBody
              data={panelData}
              path={selectedPath}
              onChange={updateValue}
              onNavigate={showInPanel}
              templateFor={templateFor}
              uploadEnabled={uploadEnabled}
              openKey={openKey}
              onOpen={(key) => {
                if (!holdForUpload()) setOpenKey(key);
              }}
              maxFor={maxFor}
            />
          </div>
        </aside>
      </div>
    </section>
  );
}
