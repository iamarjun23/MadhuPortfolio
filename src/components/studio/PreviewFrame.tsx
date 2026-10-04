"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/* The phone preview has to be a real iframe, because a phone does not get a
   reflowed page: the public layout pins its viewport to the 1280px design width,
   so a phone lays out the desktop artboard and scales it down to its screen. The
   frame is that viewport - 1280px wide and phone-shaped, zoomed to phone size by
   its CSS - so width breakpoints stay in desktop mode, `vh` and
   `orientation: portrait` read as they do on a phone, and the page scrolls
   inside the frame rather than the pane.

   The page still renders from this React tree, through a portal into the
   frame's document. That is what keeps click-to-edit alive: React dispatches
   synthetic events along the React tree rather than the DOM tree, so the
   editor's handler above the frame still receives clicks landing inside it. */

const STYLE_MARK = "data-studio-preview-style";
const TOUCH_SCREEN = /\(hover:\s*none\)\s+and\s+\(pointer:\s*coarse\)/;
const MOUSE = /\(hover:\s*hover\)\s+and\s+\(pointer:\s*fine\)/;

/* A phone's touch-only rules are part of how the page looks there, but the frame
   sits in a desktop browser and reports a mouse. Its copy of the styles is
   rewritten so the touch rules always apply and the mouse-only ones never do. */
function applyPhoneRules(rules: CSSRuleList) {
  for (const rule of rules) {
    if (isMediaRule(rule)) {
      rule.media.mediaText = rule.media.mediaText
        .replace(TOUCH_SCREEN, "all")
        .replace(MOUSE, "not all");
    }
    if (isGroupingRule(rule)) applyPhoneRules(rule.cssRules);
  }
}

// By shape, not `instanceof`: these rules belong to the frame's realm, whose
// classes are not the host's.
function isMediaRule(rule: CSSRule): rule is CSSMediaRule {
  return "media" in rule && "conditionText" in rule;
}

function isGroupingRule(rule: CSSRule): rule is CSSGroupingRule {
  return "cssRules" in rule;
}

function syncStyles(frameDoc: Document) {
  frameDoc.head.querySelectorAll(`[${STYLE_MARK}]`).forEach((node) => node.remove());
  /* Cloned rather than re-linked by href: a dev server serves its CSS as inline
     <style> tags, which have no href to copy. */
  document.head
    .querySelectorAll<HTMLLinkElement | HTMLStyleElement>('link[rel="stylesheet"], style')
    .forEach((node) => {
      const clone = node.cloneNode(true) as HTMLLinkElement | HTMLStyleElement;
      clone.setAttribute(STYLE_MARK, "");
      const rewrite = () => {
        if (clone.sheet) applyPhoneRules(clone.sheet.cssRules);
      };
      // A linked sheet has no rules to read until it has loaded; an inline one has them at once.
      clone.addEventListener("load", rewrite);
      frameDoc.head.appendChild(clone);
      if (clone.localName === "style") rewrite();
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
