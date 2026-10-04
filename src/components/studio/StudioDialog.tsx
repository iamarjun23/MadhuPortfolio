"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

type StudioDialogProps = Readonly<{
  title: string;
  /** Runs when the dialog is dismissed with Escape; the buttons inside close it themselves. */
  onClose: () => void;
  children: ReactNode;
}>;

/* Every question the Studio stops to ask (publish, leave unsaved edits, revert,
   delete) is asked here. Mounting it opens it as a modal, so the browser dims the
   page, keeps the keyboard inside, puts focus on the first button and gives it
   back afterwards, and closes on Escape. */
export function StudioDialog({ title, onClose, children }: StudioDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  /* Nothing to undo on the way out: unmounting takes the element, and its modal
     state, with it. Closing it by hand would fire `close` and report a dismissal
     nobody made. */
  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog ref={ref} className="studio-dialog" aria-labelledby={titleId} onClose={onClose}>
      <h2 id={titleId}>{title}</h2>
      {children}
    </dialog>
  );
}
