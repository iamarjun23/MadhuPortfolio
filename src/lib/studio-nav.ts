import type { DraftPart } from "@/lib/draft-diff";
import type { SectionKey } from "@/lib/sections";

// "" on the studio deployment (bare paths), "/studio" everywhere else — see next.config.mjs.
export const STUDIO_BASE = process.env.NEXT_PUBLIC_STUDIO_BASE ?? "/studio";
export const studioHome = STUDIO_BASE || "/";
export function studioHref(path: string) {
  return `${STUDIO_BASE}${path}`;
}

export type StudioShellData = Readonly<{
  hasUnpublishedChanges: boolean;
}>;

export type StudioTab = Readonly<{
  href: string;
  label: string;
  /** A separate public page rather than a section of the landing page. */
  page?: boolean;
  /** The draft this tab edits; the Menu tab edits none. */
  section?: SectionKey;
  /** The part of that draft, when the tab does not own all of it. */
  part?: DraftPart;
}>;

/* "Menu" is the Studio's own settings page (availability, password, site details).
   The rest follow the page from top to bottom. The navbar and footer live in the
   site-wide settings draft, so their tabs open that editor straight at the matching
   group. The Drawing Room draft is split the same way: its home-page invitation and
   the /room page it leads to are two different places a visitor sees, so each gets
   a tab of its own. `part` names the slice of a shared draft each of those tabs
   owns, which is how the Menu page tells which of them has unpublished edits. */
export const studioTabs: readonly StudioTab[] = [
  { href: studioHome, label: "Menu" },
  {
    href: studioHref("/settings?open=site.navigation"),
    label: "Navbar",
    section: "settings",
    part: { only: ["site.navigation"] },
  },
  { href: studioHref("/hero"), label: "Hero", section: "hero" },
  { href: studioHref("/about"), label: "About", section: "about" },
  { href: studioHref("/impact"), label: "Impact", section: "impact" },
  { href: studioHref("/clients"), label: "Clients", section: "clients" },
  { href: studioHref("/work"), label: "Work", section: "work" },
  { href: studioHref("/praise"), label: "Praise", section: "praise" },
  { href: studioHref("/experience"), label: "Experience", section: "experience" },
  {
    href: studioHref("/room?open=teaser"),
    label: "Room entrance",
    section: "room",
    part: { only: ["teaser"] },
  },
  { href: studioHref("/resume"), label: "Resume", section: "resume" },
  { href: studioHref("/contact"), label: "Contact", section: "contact" },
  {
    href: studioHref("/settings?open=site.footer"),
    label: "Footer",
    section: "settings",
    part: { only: ["site.footer"] },
  },
  {
    href: studioHref("/room"),
    label: "Drawing Room page",
    page: true,
    section: "room",
    part: { except: "teaser" },
  },
];

export const studioSectionLabels: Record<SectionKey, string> = {
  hero: "Hero",
  about: "About",
  impact: "Impact",
  clients: "Clients",
  work: "Work",
  praise: "Praise",
  experience: "Experience",
  resume: "Resume",
  room: "Drawing Room",
  contact: "Contact",
  settings: "Site & Navigation",
};
