"use client";

import type { SectionKey } from "@/lib/sections";
import { studioSectionLabels } from "@/lib/studio-nav";

type PreviewData = Record<string, unknown>;

function stringValue(data: PreviewData, key: string, fallback: string) {
  return typeof data[key] === "string" ? data[key] : fallback;
}

function arrayLength(data: PreviewData, key: string) {
  return Array.isArray(data[key]) ? data[key].length : 0;
}

function getSummary(section: SectionKey, data: PreviewData) {
  switch (section) {
    case "hero":
      return {
        eyebrow: stringValue(data, "eyebrow", "Hero"),
        title: `${stringValue(data, "line1", "Every frame")} ${stringValue(data, "line2", "holds")}`,
        detail: stringValue(data, "sub", "Your opening message"),
      };
    case "about":
    case "contact":
    case "experience":
      return {
        eyebrow: stringValue(data, "eyebrow", studioSectionLabels[section]),
        title: stringValue(data, "heading", studioSectionLabels[section]),
        detail: stringValue(data, "intro", stringValue(data, "currentStatus", "Section copy")),
      };
    case "impact":
      return {
        eyebrow: "Impact",
        title: stringValue(data, "heading", "In the room with"),
        detail: `${arrayLength(data, "stats")} metrics · ${arrayLength(data, "worked")} collaborators`,
      };
    case "work":
      return {
        eyebrow: stringValue(data, "eyebrow", "Selected work"),
        title: stringValue(data, "heading", "Every cut, one view."),
        detail: `${arrayLength(data, "lanes")} work categories`,
      };
    case "booth":
    case "praise":
      return {
        eyebrow: stringValue(data, "eyebrow", studioSectionLabels[section]),
        title: stringValue(data, "heading", studioSectionLabels[section]),
        detail: `${arrayLength(data, section === "booth" ? "slots" : "quotes")} items on display`,
      };
    case "room":
      return {
        eyebrow: stringValue(data, "eyebrow", "Off the clock"),
        title: stringValue(data, "title", "The Drawing Room"),
        detail: `${arrayLength(data, "cards")} board cards and the homepage invitation`,
      };
    case "settings":
      return {
        eyebrow: "Shared site chrome",
        title: "Navigation, footer & SEO",
        detail: "These controls appear across the portfolio, not in one section.",
      };
  }
}

export function StudioSectionPreview({
  section,
  data,
}: Readonly<{ section: SectionKey; data: PreviewData }>) {
  const summary = getSummary(section, data);

  return (
    <aside className={`studio-section-preview studio-section-preview--${section}`}>
      <header>
        <span>On the site</span>
        <i aria-hidden="true">LIVE PREVIEW</i>
      </header>
      <div className="studio-section-preview__canvas">
        <span className="studio-section-preview__eyebrow">{summary.eyebrow}</span>
        <h2>{summary.title}</h2>
        <p>{summary.detail}</p>
        <div className="studio-section-preview__line" />
        <span className="studio-section-preview__note">
          Save the draft to preserve your changes, then publish when you are ready.
        </span>
      </div>
    </aside>
  );
}
