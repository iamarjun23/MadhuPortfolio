export const sectionKeys = [
  "hero",
  "about",
  "impact",
  "work",
  "booth",
  "praise",
  "experience",
  "process",
  "room",
  "contact",
  "settings",
] as const;

export type SectionKey = (typeof sectionKeys)[number];
