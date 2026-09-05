import { z } from "zod";

export const WorkSchema = z.object({
  eyebrow: z.string().max(40).default("Selected work"),
  heading: z.string().max(100).default("Rearrange the room."),
  intro: z
    .string()
    .max(180)
    .default("Arrange the cards your way, and click any card to preview the video."),
  allProjectsLabel: z.string().max(50).default("All selected projects"),
  videoCountLabel: z.string().max(30).default("videos"),
  allFilterLabel: z.string().max(30).default("All work"),
  briefPrompt: z.string().max(50).default("Have a story?"),
  briefCta: z.string().max(40).default("Hire me"),
  canvasHint: z
    .string()
    .max(120)
    .default("Freeform canvas · drag any card anywhere · click to preview"),
  previewUnavailableLabel: z.string().max(60).default("Preview coming soon"),
  lanes: z
    .array(
      z.object({
        id: z.string(),
        label: z.string().max(40),
        projects: z
          .array(
            z.object({
              id: z.string(),
              title: z.string().max(80),
              subtitle: z.string().max(60),
              // A project's video lives on YouTube, never in our own storage: this one
              // link supplies the card thumbnail, the in-page player, and the link out.
              // There is no cover-photo upload - the thumbHint gradient covers the gap
              // when a project has no YouTube link yet.
              href: z.url().nullable(),
              hrefLabel: z.string().max(16).nullable(),
              thumbHint: z.enum(["bd-1", "bd-2", "bd-3", "bd-4"]),
            }),
          )
          .max(20),
      }),
    )
    .min(1)
    .max(6),
});

export type Work = z.infer<typeof WorkSchema>;
