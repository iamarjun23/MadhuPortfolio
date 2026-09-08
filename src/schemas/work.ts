import { z } from "zod";
import { MediaUrlSchema } from "./media";

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
  canvasHint: z.string().max(120).default("Drag any card to rearrange · click to preview"),
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
              // A project's video usually lives somewhere else - YouTube, LinkedIn or
              // Instagram - and that one link supplies the card thumbnail, the in-page
              // player and the link out. A reel that lives nowhere public can be
              // uploaded instead, and then plays from our own storage. With neither,
              // the thumbHint gradient covers the gap.
              href: z.url().nullable(),
              hrefLabel: z.string().max(16).nullable(),
              video: z
                .object({ url: MediaUrlSchema, poster: MediaUrlSchema.optional() })
                .nullable()
                .default(null),
              // YouTube hands over a still from the link alone. Instagram does not
              // publish one at any address, and LinkedIn's has to be fetched, so a
              // cover uploaded here is what keeps those cards from falling back to
              // a bare gradient. Set, it outranks whatever was worked out.
              image: z.object({ url: MediaUrlSchema, alt: z.string() }).nullable().default(null),
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
