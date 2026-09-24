"use client";

import { type RefObject, useEffect } from "react";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "iframe",
  "video[controls]",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

/** While `open`, keeps keyboard focus inside the dialog `ref` points at: it starts on the
    dialog's first control, Tab and Shift+Tab wrap around, and focus that escapes some other
    way (tabbing out of an embedded iframe) is pulled back. On close, focus returns to
    whatever opened the dialog. The dialog element needs `tabIndex={-1}` so it can take focus
    itself when it has no controls. */
export function useDialogFocus(ref: RefObject<HTMLElement | null>, open: boolean) {
  useEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog) return;

    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const controls = () =>
      [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (control) => control.getClientRects().length > 0,
      );
    (controls()[0] ?? dialog).focus();

    const wrapTab = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const items = controls();
      const first = items[0] ?? dialog;
      const last = items.at(-1) ?? dialog;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    const keepInside = (event: FocusEvent) => {
      if (event.target instanceof Node && !dialog.contains(event.target)) {
        (controls()[0] ?? dialog).focus();
      }
    };

    document.addEventListener("keydown", wrapTab);
    document.addEventListener("focusin", keepInside);
    return () => {
      document.removeEventListener("keydown", wrapTab);
      document.removeEventListener("focusin", keepInside);
      opener?.focus();
    };
  }, [ref, open]);
}
