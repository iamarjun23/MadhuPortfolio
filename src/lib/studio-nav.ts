import type { SectionKey } from "@/lib/sections";

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
    items: [{ href: "/studio", label: "Dashboard", detail: "Page map" }],
  },
  {
    label: "Page content",
    items: [
      { href: "/studio/hero", label: "Hero", detail: "Opening scene", section: "hero" },
      { href: "/studio/about", label: "About", detail: "Story & portrait", section: "about" },
      { href: "/studio/impact", label: "Impact", detail: "Metrics & people", section: "impact" },
      {
        href: "/studio/work",
        label: "Work",
        detail: "Video projects",
        section: "work",
        badge: "work",
      },
      {
        href: "/studio/booth",
        label: "Photobooth",
        detail: "On-set moments",
        section: "booth",
        badge: "booth",
      },
      {
        href: "/studio/praise",
        label: "Praise",
        detail: "Testimonials",
        section: "praise",
        badge: "praise",
      },
      {
        href: "/studio/experience",
        label: "Experience",
        detail: "Career reel",
        section: "experience",
      },
      { href: "/studio/room", label: "Drawing Room", detail: "Off-clock world", section: "room" },
      {
        href: "/studio/contact",
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
        href: "/studio/settings",
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
  room: "Drawing Room",
  contact: "Contact",
  settings: "Site & Navigation",
};
