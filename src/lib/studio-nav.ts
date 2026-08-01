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
    items: [{ href: "/studio", label: "Dashboard" }],
  },
  {
    label: "Page content",
    items: [
      { href: "/studio/hero", label: "Hero", section: "hero" },
      { href: "/studio/about", label: "About", section: "about" },
      { href: "/studio/impact", label: "Impact", section: "impact" },
      { href: "/studio/work", label: "Work", section: "work", badge: "work" },
      { href: "/studio/booth", label: "Booth", section: "booth", badge: "booth" },
      { href: "/studio/praise", label: "Praise", section: "praise", badge: "praise" },
      { href: "/studio/experience", label: "Experience", section: "experience" },
      { href: "/studio/room", label: "Drawing Room", section: "room" },
      { href: "/studio/contact", label: "Contact", section: "contact" },
    ],
  },
  {
    label: "Site",
    items: [{ href: "/studio/settings", label: "Settings", section: "settings" }],
  },
] as const;

export const studioSectionLabels: Record<SectionKey, string> = {
  hero: "Hero",
  about: "About",
  impact: "Impact",
  work: "Work",
  booth: "Booth",
  praise: "Praise",
  experience: "Experience",
  room: "Drawing Room",
  contact: "Contact",
  settings: "Settings",
};
