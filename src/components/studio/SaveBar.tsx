"use client";

import { useStudioStore } from "@/stores/studio-store";
import { studioSectionLabels } from "@/lib/studio-nav";

export function SaveBar() {
  const dirtySection = useStudioStore((state) => state.dirtySection);
  const isSaving = useStudioStore((state) => state.isSaving);
  const discard = useStudioStore((state) => state.discard);
  const saveDraft = useStudioStore((state) => state.saveDraft);
  const sectionLabel = dirtySection
    ? studioSectionLabels &&
      Object.entries(studioSectionLabels).find(([section]) => section === dirtySection)?.[1]
    : "";

  if (!dirtySection) {
    return null;
  }

  return (
    <section className="studio-save-bar" aria-label="Draft changes">
      <div className="studio-save-bar__copy">
        <span>Draft changes</span>
        <p>
          <strong>{sectionLabel || dirtySection}</strong> is ready to save.
        </p>
        <small>Save this section first, then publish all saved changes from the top bar.</small>
      </div>
      <div>
        <button
          className="button button--ghost"
          type="button"
          onClick={discard}
          disabled={isSaving}
        >
          Undo
        </button>
        <button
          className="button button--primary"
          type="button"
          onClick={() => void saveDraft()}
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Save section"}
        </button>
      </div>
    </section>
  );
}
