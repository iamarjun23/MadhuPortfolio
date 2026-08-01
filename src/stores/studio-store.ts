"use client";

import { create } from "zustand";

type ToastTone = "success" | "info" | "error";

type Toast = Readonly<{
  id: number;
  message: string;
  tone: ToastTone;
}>;

type StudioStore = {
  dirtySection: string | null;
  isSaving: boolean;
  toasts: Toast[];
  handlers: Record<string, DraftHandlers | undefined>;
  markDirty: (section: string) => void;
  clearDirty: (section?: string) => void;
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

export const useStudioStore = create<StudioStore>((set) => ({
  dirtySection: null,
  isSaving: false,
  toasts: [],
  handlers: {},
  markDirty: (section) => set({ dirtySection: section }),
  clearDirty: (section) =>
    set((state) => (!section || state.dirtySection === section ? { dirtySection: null } : state)),
  registerDraftHandlers: (section, handlers) => {
    set((state) => ({ handlers: { ...state.handlers, [section]: handlers } }));
    return () =>
      set((state) => {
        const { [section]: _removed, ...handlersWithoutSection } = state.handlers;
        return { handlers: handlersWithoutSection };
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
    const { dirtySection, handlers } = useStudioStore.getState();
    if (!dirtySection || !handlers[dirtySection]) return;
    set({ isSaving: true });
    const saved = await handlers[dirtySection].save();
    set({ isSaving: false });
    if (saved) set({ dirtySection: null });
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
