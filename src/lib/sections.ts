export const sectionKeys = [
  "hero",
  "about",
  "impact",
  "clients",
  "work",
  "praise",
  "experience",
  "resume",
  "room",
  "contact",
  "settings",
] as const;

export type SectionKey = (typeof sectionKeys)[number];
