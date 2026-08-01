export const sectionKeys = [
  "hero",
  "about",
  "impact",
  "work",
  "booth",
  "praise",
  "experience",
  "room",
  "contact",
  "settings",
] as const;

export type SectionKey = (typeof sectionKeys)[number];
