import { z } from "zod";

export const ExperienceSchema = z.object({
  roles: z
    .array(
      z.object({
        id: z.string(),
        company: z.string().max(60),
        role: z.string().max(60),
        logo: z.object({ url: z.url() }).nullable(),
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
