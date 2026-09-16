"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/* The phone preview has to be a real iframe. Every responsive rule on this site
   is an `@media (max-width: ...)` query, and those resolve against the browser
   window - narrowing a <div> to phone width leaves all of them in force, which
   is why the old preview showed desktop styling squeezed into a narrow column.
   An iframe carries its own viewport, so at 390px the frame resolves exactly
   the rules a phone resolves.

   The page still renders from this React tree, through a portal into the
   frame's document. That is what keeps click-to-edit alive: React dispatches
   synthetic events along the React tree rather than the DOM tree, so the
   editor's handler above the frame still receives clicks landing inside it. */

const STYLE_MARK = "data-studio-preview-style";

function syncStyles(frameDoc: Document) {
  frameDoc.head.querySelectorAll(`[${STYLE_MARK}]`).forEach((node) => node.remove());
  /* Cloned rather than re-linked by href: a dev server serves its CSS as inline
     <style> tags, which have no href to copy. */
  document.head.querySelectorAll('link[rel="stylesheet"], style').forEach((node) => {
    const clone = node.cloneNode(true) as HTMLElement;
    clone.setAttribute(STYLE_MARK, "");
    frameDoc.head.appendChild(clone);
  });
}

// The font variables and the light/dark switch both live on the host's <html>.
function syncRoot(frameDoc: Document) {
  frameDoc.documentElement.className = document.documentElement.className;
  frameDoc.documentElement.dataset.theme = document.documentElement.dataset.theme ?? "dark";
}

export function PreviewFrame({
  title,
  children,
}: Readonly<{ title: string; children: ReactNode }>) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [mount, setMount] = useState<HTMLElement | null>(null);
  /* A blank frame's own load event can hand back a fresh document, discarding
     whatever was set up in the one that existed at mount. Counting the loads
     re-runs the setup against whichever document the frame is holding now. */
  const [loads, setLoads] = useState(0);

  useEffect(() => {
    const frameDoc = frameRef.current?.contentDocument;
    if (!frameDoc) return;

    syncStyles(frameDoc);
    syncRoot(frameDoc);

    /* Carries the editing affordances - the hover outline on every editable
       piece of text - into the frame's document, where a selector anchored on
       the host's viewport cannot reach. */
    const root = frameDoc.createElement("div");
    root.className = "studio-canvas__viewport--editable";
    // Truthy on purpose: the editor's click walk stops on this, and an empty
    // string would read as "no marker".
    root.dataset.previewRoot = "true";
    frameDoc.body.appendChild(root);
    setMount(root);

    // Keeps the frame current while it is open: a stylesheet replaced by an HMR
    // update, or the theme toggle flipping the attribute on <html>.
    const observer = new MutationObserver(() => {
      syncStyles(frameDoc);
      syncRoot(frameDoc);
    });
    observer.observe(document.head, { childList: true });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });

    return () => {
      observer.disconnect();
      root.remove();
      setMount(null);
    };
  }, [loads]);

  return (
    <>
      <iframe
        ref={frameRef}
        title={title}
        className="studio-preview-frame"
        onLoad={() => setLoads((count) => count + 1)}
      />
      {mount ? createPortal(children, mount) : null}
    </>
  );
}
