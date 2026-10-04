"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { previewScale } from "@/lib/preview-fit";

// The live site's design width (DESIGN_WIDTH in the public layout): below it the
// site zooms the desktop layout down instead of reflowing, and so does this.
const DESIGN_WIDTH = 1280;

type PreviewFitProps = Readonly<{
  /** Desktop lays the section out at page width; the phone frame brings its own size. */
  device: "desktop" | "mobile";
  /** Show the whole section at once, rather than fitting its width and scrolling. */
  whole: boolean;
  onScale: (scale: number) => void;
  children: ReactNode;
}>;

/* Lays the preview out at its real size, then zooms it to sit inside the pane.
   `zoom` rather than a transform, because a zoomed box takes up its scaled size:
   the pane scrolls by what is actually on screen, and nothing has to be
   positioned by hand. The outer box is never zoomed itself, so its size is the
   on-screen size in every browser and dividing by the zoom gives the real one. */
export function PreviewFit({ device, whole, onScale, children }: PreviewFitProps) {
  const sizerRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState({ width: DESIGN_WIDTH, scale: 1 });

  useLayoutEffect(() => {
    const sizer = sizerRef.current;
    const page = pageRef.current;
    const pane = sizer?.parentElement;
    if (!sizer || !page || !pane) return;

    const measure = () => {
      // Read back from the node: a measurement can land before the last scale has rendered.
      const applied = Number(page.style.zoom) || 1;
      const paneSize = { width: pane.clientWidth, height: pane.clientHeight };
      const width = Math.max(paneSize.width, DESIGN_WIDTH);
      const content = {
        width: device === "desktop" ? width : sizer.offsetWidth / applied,
        height: sizer.offsetHeight / applied,
      };
      const scale = previewScale(paneSize, content, whole);
      /* Sizes are whole pixels, so the same content measures a hair differently
         at each zoom. Ignoring that hair is what stops the two chasing each other. */
      setFit((current) =>
        width === current.width && Math.abs(scale - current.scale) < 0.002
          ? current
          : { width, scale },
      );
    };

    // Measured before the first paint, so a section never flashes up at full size first.
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(pane);
    observer.observe(sizer);
    return () => observer.disconnect();
  }, [device, whole]);

  useEffect(() => onScale(fit.scale), [fit.scale, onScale]);

  // --vw stands in for 1vw across the site's CSS, so it follows the preview's width, not the window's.
  // --preview-zoom lets content that cannot be zoomed (an embedded PDF) undo the zoom for itself.
  const style = {
    zoom: fit.scale,
    "--preview-zoom": fit.scale,
    ...(device === "desktop" ? { width: fit.width, "--vw": `${fit.width / 100}px` } : null),
  } as CSSProperties;

  return (
    <div className="studio-canvas__fit" ref={sizerRef}>
      <div className="studio-canvas__page" ref={pageRef} style={style}>
        {children}
      </div>
    </div>
  );
}
