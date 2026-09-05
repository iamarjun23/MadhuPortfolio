import { z } from "zod";
import { MediaUrlSchema } from "./media";

export const ExperienceSchema = z.object({
  eyebrow: z.string().max(40).default("Experience"),
  heading: z.string().max(100).default("A career cut into scenes."),
  intro: z
    .string()
    .max(220)
    .default(
      "Move through the rooms that shaped the way I find rhythm, build tension, and land a story.",
    ),
  reelLabel: z.string().max(40).default("Career reel"),
  defaultLocation: z.string().max(50).default("Creative room"),
  sceneLabel: z.string().max(30).default("Scene"),
  scenesLabel: z.string().max(30).default("scenes"),
  previousLabel: z.string().max(40).default("Previous scene"),
  nextLabel: z.string().max(40).default("Next scene"),
  roles: z
    .array(
      z.object({
        id: z.string(),
        company: z.string().max(60),
        role: z.string().max(60),
        image: z.object({ url: MediaUrlSchema, alt: z.string() }).nullable().default(null),
        logo: z.object({ url: MediaUrlSchema }).nullable(),
        logoHint: z.enum(["l-jar", "l-onep", "l-ulc", "l-hb", "custom"]).default("custom"),
        initials: z.string().max(4),
        start: z.string().max(20),
        end: z.string().max(20),
        duration: z.string().max(20),
        location: z.string().max(40).optional(),
        description: z.string().max(400),
      }),
    )
    .max(20),
});

export type Experience = z.infer<typeof ExperienceSchema>;
