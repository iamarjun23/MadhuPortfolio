import { partEdited, type DraftPart, type SectionRow } from "@/lib/draft-diff";
import type { SectionKey } from "@/lib/sections";

// "" on the studio deployment (bare paths), "/studio" everywhere else — see next.config.mjs.
export const STUDIO_BASE = process.env.NEXT_PUBLIC_STUDIO_BASE ?? "/studio";
export const studioHome = STUDIO_BASE || "/";
export function studioHref(path: string) {
  return `${STUDIO_BASE}${path}`;
}

export type StudioShellData = Readonly<{
  hasUnpublishedChanges: boolean;
  /** The label of every tab and site detail whose saved edits are not live yet. */
  edited: readonly string[];
  /** What the publish checks still find missing, in their own words. */
  flagged: readonly string[];
}>;

export type StudioTab = Readonly<{
  href: string;
  label: string;
  /** A separate public page rather than a section of the landing page. */
  page?: boolean;
  /** The draft this tab edits; the Studio tab edits none. */
  section?: SectionKey;
  /** The part of that draft, when the tab does not own all of it. */
  part?: DraftPart;
}>;

/* "Studio" is the Studio's own home page (availability, password, site details) and
   doubles as the wordmark. The rest follow the page from top to bottom. The navbar
   and footer live in the site-wide settings draft, so their tabs open that editor
   straight at the matching group. The Drawing Room draft is split the same way: its
   home-page invitation and the /room page it leads to are two different places a
   visitor sees, so each gets a tab of its own. `part` names the slice of a shared
   draft each of those tabs owns, which is how the Studio tells which of them has
   unpublished edits. */
export const studioTabs: readonly StudioTab[] = [
  { href: studioHome, label: "Studio" },
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
    label: "Room page",
    page: true,
    section: "room",
    part: { except: "teaser" },
  },
];

/* The settings editors with no tab of their own, reached from the Studio page.
   Between them and the Navbar and Footer tabs every key of the settings draft is
   covered, so an edit anywhere in it is reported under exactly one label. */
export const siteDetails = [
  {
    href: studioHref("/settings?open=seo"),
    label: "Google and sharing",
    detail: "Page title, description and share image",
    section: "settings",
    part: { only: ["seo"] },
  },
  {
    href: studioHref("/settings?open=site.brand"),
    label: "Brand",
    detail: "The wordmark in the navbar and footer",
    section: "settings",
    part: { only: ["site.brand"] },
  },
  {
    href: studioHref("/settings"),
    label: "Look and domain",
    detail: "Motion, stand-in photo, owner name and domain",
    section: "settings",
    part: { only: ["appearance", "fallbackImage", "domain", "site.ownerName"] },
  },
] as const satisfies ReadonlyArray<StudioTab & { detail: string }>;

/** The tab or site detail that an editor opened at `path` was reached from. */
export function studioTabFor(
  section: SectionKey,
  path: readonly (string | number)[],
): StudioTab | undefined {
  const href = studioHref(`/${section}${path.length > 0 ? `?open=${path.join(".")}` : ""}`);
  return [...studioTabs, ...siteDetails].find((item) => item.href === href);
}

/** The Studio's own name for every part of the site whose saved edits are not live yet. */
export function editedLabels(rows: readonly SectionRow[]): string[] {
  return [...studioTabs, ...siteDetails].flatMap((item) =>
    item.section && partEdited(rows, item.section, item.part) ? [item.label] : [],
  );
}

/* The activity log writes one line per save, so an afternoon on one section reads
   as the same line six times. Lines that repeat back to back fold into the newest
   of them with a count. */
export function foldRepeats<T extends { message: string }>(activity: readonly T[]) {
  return activity.reduce<Array<T & { count: number }>>((folded, item) => {
    const last = folded.at(-1);
    if (last?.message === item.message) last.count += 1;
    else folded.push({ ...item, count: 1 });
    return folded;
  }, []);
}

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
