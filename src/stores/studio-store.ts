"use client";

import { create } from "zustand";

type ToastTone = "success" | "info" | "error";

type Toast = Readonly<{
  id: number;
  message: string;
  tone: ToastTone;
}>;

/* An upload the studio is currently streaming to R2. The label names the field it
   belongs to so every other control can say what it is waiting for, and the token
   lets a release only clear the upload that took the lock - a dropzone unmounting
   late used to wipe the lock a newer upload had since taken. */
type ActiveUpload = Readonly<{
  token: number;
  label: string;
}>;

type StudioStore = {
  dirtySection: string | null;
  isSaving: boolean;
  activeUpload: ActiveUpload | null;
  hasUnpublishedChanges: boolean;
  toasts: Toast[];
  handlers: Record<string, DraftHandlers | undefined>;
  beginUpload: (label: string) => number | null;
  endUpload: (token: number) => void;
  markDirty: (section: string) => void;
  clearDirty: (section?: string) => void;
  setHasUnpublishedChanges: (hasUnpublishedChanges: boolean) => void;
  registerDraftHandlers: (section: string, handlers: DraftHandlers) => () => void;
  discard: () => void;
  saveDraft: () => Promise<void>;
  pushToast: (message: string, tone?: ToastTone) => void;
  dismissToast: (id: number) => void;
};

type DraftHandlers = Readonly<{
  discard: () => void;
  save: () => Promise<boolean>;
}>;

let nextToastId = 1;
let nextUploadToken = 1;

export const useStudioStore = create<StudioStore>((set) => ({
  dirtySection: null,
  isSaving: false,
  activeUpload: null,
  hasUnpublishedChanges: false,
  toasts: [],
  handlers: {},
  /* Uploads run one at a time across the whole studio. Each dropzone used to hold
     its own in-flight flag, so nothing stopped several files streaming at once, or
     stopped a draft being saved while the URL it needed was still on its way - the
     save wrote the field as it stood and the finished upload had nowhere to land.
     Taking a single lock here is what lets the save bar, publish button and rail
     see an upload at all. Returns the token to release with, or null when another
     upload already holds it. */
  beginUpload: (label) => {
    if (useStudioStore.getState().activeUpload) return null;
    const token = nextUploadToken++;
    set({ activeUpload: { token, label } });
    return token;
  },
  endUpload: (token) =>
    set((state) => (state.activeUpload?.token === token ? { activeUpload: null } : state)),
  markDirty: (section) => set({ dirtySection: section }),
  clearDirty: (section) =>
    set((state) => (!section || state.dirtySection === section ? { dirtySection: null } : state)),
  setHasUnpublishedChanges: (hasUnpublishedChanges) => set({ hasUnpublishedChanges }),
  registerDraftHandlers: (section, handlers) => {
    set((state) => ({ handlers: { ...state.handlers, [section]: handlers } }));
    /* The editor that owned these edits has gone, and its unsaved draft went with
       it. Letting `dirtySection` outlive it left the save bar offering to save a
       section that was no longer on screen, and pressing Save did nothing at all. */
    return () =>
      set((state) => {
        const { [section]: _removed, ...handlersWithoutSection } = state.handlers;
        return {
          handlers: handlersWithoutSection,
          dirtySection: state.dirtySection === section ? null : state.dirtySection,
        };
      });
  },
  discard: () => {
    const { dirtySection, handlers } = useStudioStore.getState();
    if (!dirtySection) return;
    handlers[dirtySection]?.discard();
    set((state) => ({
      dirtySection: null,
      toasts: [...state.toasts, { id: nextToastId++, message: "Changes discarded", tone: "info" }],
    }));
  },
  saveDraft: async () => {
    const { dirtySection, handlers, isSaving, activeUpload } = useStudioStore.getState();
    /* Two callers reach this - the save bar and the rail's "save, then go" - and
       only the save bar's button carries a disabled state, so the guard has to
       live here as well. A second save entering while the first is in flight
       would race the draft version the editor holds and lose the later write. */
    if (isSaving || activeUpload) return;
    if (!dirtySection || !handlers[dirtySection]) return;
    set({ isSaving: true });
    try {
      const saved = await handlers[dirtySection].save();
      if (saved) set({ dirtySection: null, hasUnpublishedChanges: true });
    } finally {
      /* A save that throws used to leave `isSaving` stuck on, disabling the save
         bar for the rest of the session with no way back but a reload. */
      set({ isSaving: false });
    }
  },
  pushToast: (message, tone = "info") =>
    set((state) => ({
      toasts: [...state.toasts, { id: nextToastId++, message, tone }],
    })),
  dismissToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),
}));

/* One place for "is the studio blocked by an in-flight upload right now", so a
   control gating on activeUpload reaches for this instead of re-deriving it. */
export function useUploadBlock() {
  const activeUpload = useStudioStore((state) => state.activeUpload);
  return { blocked: Boolean(activeUpload), label: activeUpload?.label ?? null };
}
