import { z } from "zod";

export const HeroSchema = z.object({
  eyebrow: z.string().max(140),
  line1: z.string().max(60),
  line2: z.string().max(60),
  cutWords: z.array(z.string().min(1).max(24)).min(1).max(10),
  sub: z.string().max(220),
  primaryCta: z.object({ label: z.string(), href: z.string() }),
  secondaryCta: z.object({ label: z.string(), href: z.string() }),
  bgVideo: z.object({
    url: z.url(),
    poster: z.url().optional(),
    duotone: z.boolean().default(true),
  }),
});

export type Hero = z.infer<typeof HeroSchema>;
