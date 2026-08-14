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
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { saveDraft } from "@/actions/save-draft";
import { Dropzone, type UploadEndpoint } from "@/components/studio/Dropzone";
import { HeroPreview } from "@/components/studio/HeroPreview";
import { SaveBar } from "@/components/studio/SaveBar";
import { StudioSectionPreview } from "@/components/studio/StudioSectionPreview";
import { SettingsDangerZone } from "@/components/studio/SettingsDangerZone";
import { HeroSchema } from "@/schemas";
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
        label={config.isVideo ? "Upload hero video" : `Upload ${label.toLowerCase()}`}
        value={url || undefined}
        enabled={uploadEnabled}
        onUploaded={(upload) => setUrl(upload.url)}
        onDeleted={() => setUrl("")}
      />
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

type SectionEditorProps = Readonly<{
  section: SectionKey;
  data: unknown;
  uploadEnabled: boolean;
}>;

export function SectionEditor({ section, data, uploadEnabled }: SectionEditorProps) {
  const router = useRouter();
  const [savedData, setSavedData] = useState(() => normalizeObject(data));
  const { formState, getValues, handleSubmit, reset, setValue, watch } = useForm<{ data: unknown }>(
    {
      defaultValues: { data: savedData },
    },
  );
  const markDirty = useStudioStore((state) => state.markDirty);
  const clearDirty = useStudioStore((state) => state.clearDirty);
  const pushToast = useStudioStore((state) => state.pushToast);
  const registerDraftHandlers = useStudioStore((state) => state.registerDraftHandlers);
  const currentData = normalizeObject(watch("data"));
  const hero = section === "hero" ? HeroSchema.safeParse(currentData) : null;

  const updateValue = useCallback(
    (path: readonly (string | number)[], value: EditorValue) => {
      setValue("data", updateAtPath(normalizeObject(getValues("data")), path, value), {
        shouldDirty: true,
      });
    },
    [getValues, setValue],
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

  useEffect(() => {
    const nextData = normalizeObject(data);
    setSavedData(nextData);
    reset({ data: nextData });
    clearDirty(section);
  }, [clearDirty, data, reset, section]);

  return (
    <section
      className={`studio-page studio-editor studio-editor--${section}`}
      aria-labelledby="studio-section-title"
    >
      <div className="studio-editor__heading">
        <div>
          <span className="slate">Page content</span>
          <h1 id="studio-section-title">{studioSectionLabels[section]}</h1>
          <p>
            Change a field, open only the content card you need, then save this section as a draft.
          </p>
        </div>
      </div>
      <div className="studio-editor__layout">
        <form
          className="studio-editor__form"
          onSubmit={(event) => void handleSubmit(() => undefined)(event)}
        >
          {Object.entries(currentData).map(([key, value]) => {
            const isCompact = !Array.isArray(value) && !isEditorObject(value);

            return (
              <section
                className={`studio-editor__group${isCompact ? " studio-editor__group--compact" : ""}`}
                key={key}
              >
                {!isCompact ? (
                  <header>
                    <span>{labelFor(key)}</span>
                    <small>Editable content</small>
                  </header>
                ) : null}
                <ValueEditor
                  value={value}
                  label={labelFor(key)}
                  path={[key]}
                  onChange={updateValue}
                  uploadEnabled={uploadEnabled}
                />
              </section>
            );
          })}
        </form>
        <div className="studio-editor__preview-stack">
          <StudioSectionPreview section={section} data={currentData} />
          {hero?.success ? <HeroPreview data={hero.data} /> : null}
          <SaveBar />
        </div>
      </div>
      {section === "settings" ? <SettingsDangerZone /> : null}
    </section>
  );
}
