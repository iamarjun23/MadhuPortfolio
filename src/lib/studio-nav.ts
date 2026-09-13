import type { SectionKey } from "@/lib/sections";

// "" on the studio deployment (bare paths), "/studio" everywhere else — see next.config.mjs.
export const STUDIO_BASE = process.env.NEXT_PUBLIC_STUDIO_BASE ?? "/studio";
export const studioHome = STUDIO_BASE || "/";
export function studioHref(path: string) {
  return `${STUDIO_BASE}${path}`;
}

export type StudioBadgeCounts = Readonly<{
  work: number;
  booth: number;
  praise: number;
}>;

export type StudioShellData = Readonly<{
  badges: StudioBadgeCounts;
  hasUnpublishedChanges: boolean;
}>;

type StudioNavItem = Readonly<{
  href: string;
  label: string;
  detail?: string;
  section?: SectionKey;
  badge?: keyof StudioBadgeCounts;
}>;

type StudioNavGroup = Readonly<{
  label: string;
  items: readonly StudioNavItem[];
}>;

export const studioNavGroups: readonly StudioNavGroup[] = [
  {
    label: "Overview",
    items: [{ href: studioHome, label: "Dashboard", detail: "Page map" }],
  },
  {
    label: "Page content",
    items: [
      { href: studioHref("/hero"), label: "Hero", detail: "Opening scene", section: "hero" },
      { href: studioHref("/about"), label: "About", detail: "Story & portrait", section: "about" },
      { href: studioHref("/impact"), label: "Impact", detail: "Metrics & people", section: "impact" },
      {
        href: studioHref("/work"),
        label: "Work",
        detail: "Video projects",
        section: "work",
        badge: "work",
      },
      {
        href: studioHref("/booth"),
        label: "Photobooth",
        detail: "On-set moments",
        section: "booth",
        badge: "booth",
      },
      {
        href: studioHref("/praise"),
        label: "Praise",
        detail: "Testimonials",
        section: "praise",
        badge: "praise",
      },
      {
        href: studioHref("/experience"),
        label: "Experience",
        detail: "Career reel",
        section: "experience",
      },
      {
        href: studioHref("/process"),
        label: "Studio Page",
        detail: "How I work & turnaround",
        section: "process",
      },
      { href: studioHref("/room"), label: "Drawing Room", detail: "Off-clock world", section: "room" },
      {
        href: studioHref("/contact"),
        label: "Contact",
        detail: "Project invitation",
        section: "contact",
      },
    ],
  },
  {
    label: "Shared site",
    items: [
      {
        href: studioHref("/settings"),
        label: "Site & Navigation",
        detail: "Brand, footer & SEO",
        section: "settings",
      },
    ],
  },
] as const;

export const studioSectionLabels: Record<SectionKey, string> = {
  hero: "Hero",
  about: "About",
  impact: "Impact",
  work: "Work",
  booth: "Photobooth",
  praise: "Praise",
  experience: "Experience",
  process: "Studio Page",
  room: "Drawing Room",
  contact: "Contact",
  settings: "Site & Navigation",
};
