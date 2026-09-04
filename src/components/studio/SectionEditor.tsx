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
import { memo, useCallback, useDeferredValue, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { saveDraft } from "@/actions/save-draft";
import { Dropzone, type UploadEndpoint } from "@/components/studio/Dropzone";
import { SaveBar } from "@/components/studio/SaveBar";
import { SettingsDangerZone } from "@/components/studio/SettingsDangerZone";
import type { SectionKey } from "@/lib/sections";
import { studioSectionLabels } from "@/lib/studio-nav";
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

function labelFor(key: string) {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());
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

function ScalarEditor({ value, label, path, onChange }: ValueEditorProps) {
  const key = String(path[path.length - 1] ?? "");
  const options = selectOptions[key];
  const id = `studio-${path.join("-")}`;

  if (typeof value === "boolean") {
    return (
      <label className="studio-switch" htmlFor={id}>
        <span>{label}</span>
        <input
          id={id}
          type="checkbox"
          checked={value}
          onChange={(event) => onChange(path, event.target.checked)}
        />
      </label>
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
          onChange={(event) => onChange(path, Number(event.target.value))}
        />
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
          onChange={(event) => onChange(path, event.target.value || null)}
        />
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
          onChange={(event) => onChange(path, event.target.value || null)}
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option || "None"}
            </option>
          ))}
        </select>
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
        {key === "sub" || key === "description" ? <b>{value.length}</b> : null}
      </span>
      {multiline ? (
        <textarea
          id={id}
          value={value}
          rows={Math.min(6, Math.max(3, Math.ceil(value.length / 68)))}
          onChange={(event) => onChange(path, event.target.value)}
        />
      ) : (
        <input id={id} value={value} onChange={(event) => onChange(path, event.target.value)} />
      )}
    </label>
  );
}

type MediaConfig = Readonly<{
  endpoint: UploadEndpoint;
  acceptsAlt: boolean;
  isVideo?: boolean;
  isOptional?: boolean;
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
    return {
      endpoint: path[0] === "slots" ? "boothImage" : "roomImage",
      acceptsAlt: true,
    };
  }
  return undefined;
}

function setOptionalString(object: EditorObject, key: string, value: string): EditorObject {
  const next = { ...object };
  if (value) next[key] = value;
  else delete next[key];
  return next;
}

function MediaEditor({ value, label, path, onChange, uploadEnabled }: ValueEditorProps) {
  const config = getMediaConfig(value, path);
  if (!config) return null;

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

  return (
    <fieldset className="studio-object studio-media-field">
      <legend>{label}</legend>
      <Dropzone
        endpoint={config.endpoint}
        label={config.isVideo ? "Upload video" : "Upload image"}
        value={url || undefined}
        enabled={uploadEnabled}
        onUploaded={(upload) => setUrl(upload.url)}
        onDeleted={() => setUrl("")}
      />
      <p className="studio-media-field__hint">
        {config.isVideo
          ? "Upload a video file for this section, then save the draft to keep it."
          : "Upload an image for this section, add descriptive alt text, then save the draft."}
      </p>
      <label className="studio-field" htmlFor={`studio-${path.join("-")}-url`}>
        <span>Media URL</span>
        <input
          id={`studio-${path.join("-")}-url`}
          type="url"
          value={url}
          placeholder="https://"
          onChange={(event) => setUrl(event.target.value)}
        />
      </label>
      {config.acceptsAlt ? (
        <label className="studio-field" htmlFor={`studio-${path.join("-")}-alt`}>
          <span>Alt text</span>
          <input
            id={`studio-${path.join("-")}-alt`}
            value={alt}
            onChange={(event) => onChange(path, { ...object, url, alt: event.target.value })}
          />
        </label>
      ) : null}
      {config.isVideo ? (
        <>
          <label className="studio-field" htmlFor={`studio-${path.join("-")}-poster`}>
            <span>Poster URL</span>
            <input
              id={`studio-${path.join("-")}-poster`}
              type="url"
              value={poster}
              placeholder="https://"
              onChange={(event) =>
                onChange(path, setOptionalString(object, "poster", event.target.value))
              }
            />
          </label>
          <label className="studio-switch" htmlFor={`studio-${path.join("-")}-duotone`}>
            <span>Duotone</span>
            <input
              id={`studio-${path.join("-")}-duotone`}
              type="checkbox"
              checked={duotone}
              onChange={(event) => onChange(path, { ...object, duotone: event.target.checked })}
            />
          </label>
        </>
      ) : null}
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
  const template = value[0] ?? lastTemplate;
  const [selectedIndex, setSelectedIndex] = useState(0);
  const activeIndex = Math.min(selectedIndex, Math.max(0, value.length - 1));
  const selectedItem = value[activeIndex];

  const handleDragEnd = (event: DragEndEvent) => {
    if (!event.over || event.active.id === event.over.id) return;
    onChange(path, reorder(value, String(event.active.id), String(event.over.id)));
  };

  const records = value.map((item, index) => {
    const record = (
      <button
        className={`studio-array__record${activeIndex === index ? " is-active" : ""}`}
        type="button"
        onClick={() => setSelectedIndex(index)}
        aria-pressed={activeIndex === index}
      >
        <span>
          <b>{itemTitle(item, `${label} ${index + 1}`)}</b>
          <small>{`${label} ${index + 1}`}</small>
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
        <h2>{label}</h2>
        {template !== undefined ? (
          <button className="studio-add-row" type="button" onClick={addItem}>
            Add item
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
                  <span>Editing item</span>
                  <strong>{itemTitle(selectedItem, `${label} ${activeIndex + 1}`)}</strong>
                </div>
                <button
                  className="studio-row-remove"
                  type="button"
                  aria-label={`Remove ${label} ${activeIndex + 1}`}
                  onClick={removeSelectedItem}
                >
                  Remove
                </button>
              </header>
              <ValueEditor
                value={selectedItem}
                label={`${label} ${activeIndex + 1}`}
                path={[...path, activeIndex]}
                onChange={onChange}
                uploadEnabled={uploadEnabled}
              />
            </div>
          ) : null}
        </div>
      ) : (
        <p className="studio-array__empty">
          No {label.toLowerCase()} yet. Add the first item to begin.
        </p>
      )}
    </section>
  );
}

function ValueEditor({ value, label, path, onChange, uploadEnabled }: ValueEditorProps) {
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
    return (
      <fieldset className="studio-object">
        <legend>{label}</legend>
        {Object.entries(value).map(([key, entry]) => (
          <ValueEditor
            key={key}
            value={entry}
            label={labelFor(key)}
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

type CanvasTextProps = Readonly<{
  label: string;
  value: string;
  multiline?: boolean;
  selected?: boolean;
  onChange: (value: string) => void;
  onSelect: () => void;
}>;

function CanvasText({
  label,
  value,
  multiline = false,
  selected = false,
  onChange,
  onSelect,
}: CanvasTextProps) {
  const className = `studio-canvas__text${selected ? " is-selected" : ""}`;

  return multiline ? (
    <textarea
      className={className}
      aria-label={`Edit ${label}`}
      value={value}
      rows={3}
      onFocus={onSelect}
      onChange={(event) => onChange(event.target.value)}
    />
  ) : (
    <input
      className={className}
      aria-label={`Edit ${label}`}
      value={value}
      onFocus={onSelect}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

type EditorCanvasProps = Readonly<{
  section: SectionKey;
  data: EditorObject;
  activeKey: string;
  device: "desktop" | "mobile";
  onChange: (path: readonly (string | number)[], value: EditorValue) => void;
  onSelect: (key: string) => void;
}>;

function heroString(data: EditorObject, key: string) {
  const value = data[key];
  return typeof value === "string" ? value : "";
}

function HeroCanvas({
  data,
  activeKey,
  onChange,
  onSelect,
}: Omit<EditorCanvasProps, "section" | "device">) {
  const primaryEntry = data.primaryCta;
  const primaryCta = primaryEntry && isEditorObject(primaryEntry) ? primaryEntry : {};
  const primaryLabel = typeof primaryCta.label === "string" ? primaryCta.label : "";
  const bgVideoEntry = data.bgVideo;
  const bgVideo = bgVideoEntry && isEditorObject(bgVideoEntry) ? bgVideoEntry : {};
  const videoUrl = typeof bgVideo.url === "string" ? bgVideo.url : undefined;
  const videoPoster = typeof bgVideo.poster === "string" ? bgVideo.poster : undefined;
  const cutWords = Array.isArray(data.cutWords)
    ? data.cutWords.filter((word): word is string => typeof word === "string")
    : [];

  return (
    <div className="studio-canvas-hero">
      {videoUrl ? (
        <div className="studio-canvas-hero__media" aria-hidden="true">
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            poster={videoPoster}
            src={videoUrl}
          />
        </div>
      ) : null}
      <span className="studio-canvas-hero__frame">LIVE / 01</span>
      <div className="studio-canvas-hero__content">
        <CanvasText
          label="eyebrow"
          value={heroString(data, "eyebrow")}
          selected={activeKey === "eyebrow"}
          onSelect={() => onSelect("eyebrow")}
          onChange={(value) => onChange(["eyebrow"], value)}
        />
        <div className="studio-canvas-hero__headline">
          <CanvasText
            label="first headline line"
            value={heroString(data, "line1")}
            selected={activeKey === "line1"}
            onSelect={() => onSelect("line1")}
            onChange={(value) => onChange(["line1"], value)}
          />
          <CanvasText
            label="second headline line"
            value={heroString(data, "line2")}
            selected={activeKey === "line2"}
            onSelect={() => onSelect("line2")}
            onChange={(value) => onChange(["line2"], value)}
          />
          <button
            className={`studio-canvas-hero__cut-word${activeKey === "cutWords" ? " is-selected" : ""}`}
            type="button"
            onClick={() => onSelect("cutWords")}
            aria-label="Edit rotating cut words"
          >
            {cutWords[0] || "Add a cut word"}
          </button>
        </div>
        <CanvasText
          label="hero description"
          value={heroString(data, "sub")}
          multiline
          selected={activeKey === "sub"}
          onSelect={() => onSelect("sub")}
          onChange={(value) => onChange(["sub"], value)}
        />
        <CanvasText
          label="primary button label"
          value={primaryLabel}
          selected={activeKey === "primaryCta"}
          onSelect={() => onSelect("primaryCta")}
          onChange={(value) => onChange(["primaryCta", "label"], value)}
        />
      </div>
      <span className="studio-canvas-hero__credit">CUT BY N MADHU KUMAR · BENGALURU</span>
    </div>
  );
}

function GenericCanvas({
  section,
  data,
  activeKey,
  onChange,
  onSelect,
}: Omit<EditorCanvasProps, "device">) {
  const textEntries = Object.entries(data)
    .filter((entry): entry is [string, string] => typeof entry[1] === "string")
    .slice(0, 3);
  const detailEntries = Object.entries(data).filter(([, value]) => typeof value !== "string");

  return (
    <div className="studio-canvas-generic">
      <span className="studio-canvas-generic__index">SECTION / {studioSectionLabels[section]}</span>
      <div className="studio-canvas-generic__content">
        {textEntries.length > 0 ? (
          textEntries.map(([key, value], index) => (
            <CanvasText
              key={key}
              label={labelFor(key)}
              value={value}
              multiline={index === textEntries.length - 1 && value.length > 72}
              selected={activeKey === key}
              onSelect={() => onSelect(key)}
              onChange={(nextValue) => onChange([key], nextValue)}
            />
          ))
        ) : (
          <button
            className="studio-canvas-generic__empty"
            type="button"
            onClick={() => onSelect(activeKey)}
          >
            Select an element to begin editing this section
          </button>
        )}
      </div>
      {detailEntries.length > 0 ? (
        <div className="studio-canvas-generic__details" aria-label="Section details">
          {detailEntries.slice(0, 4).map(([key, value]) => (
            <button
              className={activeKey === key ? "is-selected" : ""}
              type="button"
              key={key}
              onClick={() => onSelect(key)}
            >
              <span>{labelFor(key)}</span>
              <small>
                {Array.isArray(value)
                  ? `${value.length} items`
                  : getMediaConfig(value, [key])
                    ? "Media upload"
                    : "Open inspector"}
              </small>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

const EditorCanvas = memo(function EditorCanvas({
  section,
  data,
  activeKey,
  device,
  onChange,
  onSelect,
}: EditorCanvasProps) {
  return (
    <section
      className={`studio-canvas studio-canvas--${device}`}
      aria-label="Editable live preview"
    >
      <header className="studio-canvas__topbar">
        <span>Editing on the site</span>
        <span>Click copy to edit</span>
      </header>
      <div className="studio-canvas__viewport">
        {section === "hero" ? (
          <HeroCanvas data={data} activeKey={activeKey} onChange={onChange} onSelect={onSelect} />
        ) : (
          <GenericCanvas
            section={section}
            data={data}
            activeKey={activeKey}
            onChange={onChange}
            onSelect={onSelect}
          />
        )}
      </div>
    </section>
  );
});

type SectionEditorProps = Readonly<{
  section: SectionKey;
  data: unknown;
  uploadEnabled: boolean;
}>;

export function SectionEditor({ section, data, uploadEnabled }: SectionEditorProps) {
  const router = useRouter();
  const [savedData, setSavedData] = useState(() => normalizeObject(data));
  const [currentData, setCurrentData] = useState(() => normalizeObject(data));
  const currentDataRef = useRef(currentData);
  const [activeKey, setActiveKey] = useState(() => Object.keys(savedData)[0] ?? "");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
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

  const selectedKey = activeKey in currentData ? activeKey : (Object.keys(currentData)[0] ?? "");
  const activeValue = currentData[selectedKey];
  const directMediaFields = Object.entries(currentData).filter((entry) =>
    Boolean(getMediaConfig(entry[1], [entry[0]])),
  );

  return (
    <section
      className={`studio-page studio-editor studio-editor--${section}`}
      aria-labelledby="studio-section-title"
    >
      <div className="studio-editor__heading">
        <div>
          <span className="slate">Visual editor</span>
          <h1 id="studio-section-title">{studioSectionLabels[section]}</h1>
          <p>Edit the page itself. Select a detail only when you need precise settings.</p>
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
      <div className="studio-editor__layout">
        <EditorCanvas
          section={section}
          data={previewData}
          activeKey={selectedKey}
          device={previewDevice}
          onChange={updateValue}
          onSelect={setActiveKey}
        />
        <aside className="studio-inspector" aria-label="Element inspector">
          <header className="studio-inspector__heading">
            <span>Inspector</span>
            <p>Choose an element, then fine-tune its content.</p>
          </header>
          {directMediaFields.length > 0 ? (
            <section className="studio-inspector__media" aria-labelledby="studio-media-title">
              <header>
                <span>Media uploads</span>
                <h2 id="studio-media-title">Images &amp; video</h2>
                <p>Upload files here, then save the draft.</p>
              </header>
              <div>
                {directMediaFields.map(([key, value]) => (
                  <MediaEditor
                    key={key}
                    value={value}
                    label={labelFor(key)}
                    path={[key]}
                    onChange={updateValue}
                    uploadEnabled={uploadEnabled}
                  />
                ))}
              </div>
            </section>
          ) : null}
          <nav className="studio-inspector__elements" aria-label="Editable elements">
            {Object.entries(currentData).map(([key, value]) => (
              <button
                className={selectedKey === key ? "is-active" : ""}
                type="button"
                key={key}
                aria-pressed={selectedKey === key}
                onClick={() => setActiveKey(key)}
              >
                <span>{labelFor(key)}</span>
                <small>
                  {Array.isArray(value)
                    ? `${value.length} items`
                    : getMediaConfig(value, [key])
                      ? "Media"
                      : isEditorObject(value)
                        ? "Settings"
                        : "Text"}
                </small>
              </button>
            ))}
          </nav>
          {activeValue !== undefined ? (
            <form
              className="studio-inspector__form"
              onSubmit={(event) => void handleSubmit(() => undefined)(event)}
            >
              <div className="studio-inspector__selected">
                <span>Selected element</span>
                <h2>{labelFor(selectedKey)}</h2>
              </div>
              <ValueEditor
                value={activeValue}
                label={labelFor(selectedKey)}
                path={[selectedKey]}
                onChange={updateValue}
                uploadEnabled={uploadEnabled}
              />
            </form>
          ) : null}
          <SaveBar />
        </aside>
      </div>
      {section === "settings" ? <SettingsDangerZone /> : null}
    </section>
  );
}
