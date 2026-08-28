import { z } from "zod";

export const AboutSchema = z.object({
  eyebrow: z.string().max(40).default("About me"),
  portrait: z.object({ url: z.url(), alt: z.string() }).nullable(),
  portraitVideo: z
    .object({
      url: z.url(),
      poster: z.url().optional(),
    })
    .nullable()
    .default(null),
  heading: z.string().max(80),
  paragraphs: z.array(z.string().max(500)).min(1).max(6),
  statusLabel: z.string().max(30).default("Status"),
  currentStatus: z.string().max(80),
  skillsLabel: z.string().max(30).default("Tools"),
  skills: z.array(z.string().max(32)).max(20),
  skillGroups: z
    .array(
      z.object({
        label: z.string().max(30),
        items: z.array(z.string().max(32)).max(12),
      }),
    )
    .max(6)
    .default([
      { label: "Software", items: ["Premiere Pro", "After Effects", "Sound design"] },
      { label: "Also", items: ["Story & flow", "On set"] },
      { label: "Learning", items: ["Motion graphics"] },
    ]),
});

export type About = z.infer<typeof AboutSchema>;
