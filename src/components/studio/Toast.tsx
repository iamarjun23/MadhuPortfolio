"use client";

import { useEffect } from "react";
import { useStudioStore } from "@/stores/studio-store";

function ToastMessage({
  id,
  message,
  tone,
}: Readonly<{ id: number; message: string; tone: "success" | "info" | "error" }>) {
  const dismissToast = useStudioStore((state) => state.dismissToast);

  /* An error names the fields that need attention, so it stays up long enough to
     read and act on; a "Draft saved" only has to be noticed. */
  useEffect(() => {
    const timeout = window.setTimeout(() => dismissToast(id), tone === "error" ? 12_000 : 2600);
    return () => window.clearTimeout(timeout);
  }, [dismissToast, id, tone]);

  return (
    <li className={`studio-toast studio-toast--${tone}`} role="status">
      <span>{message}</span>
      <button type="button" onClick={() => dismissToast(id)} aria-label="Dismiss notification">
        x
      </button>
    </li>
  );
}

export function Toast() {
  const toasts = useStudioStore((state) => state.toasts);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <ul className="studio-toasts" aria-live="polite" aria-label="Notifications">
      {toasts.map((toast) => (
        <ToastMessage key={toast.id} {...toast} />
      ))}
    </ul>
  );
}
