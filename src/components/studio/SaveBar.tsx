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
    <div className="studio-save-bar" role="status">
      <p>
        Unsaved changes in <strong>{sectionLabel || dirtySection}</strong>
      </p>
      <div>
        <button
          className="button button--ghost"
          type="button"
          onClick={discard}
          disabled={isSaving}
        >
          Discard
        </button>
        <button
          className="button button--primary"
          type="button"
          onClick={() => void saveDraft()}
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Save draft"}
        </button>
      </div>
    </div>
  );
}
