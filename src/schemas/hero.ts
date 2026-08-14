import { z } from "zod";

export const HeroSchema = z.object({
  eyebrow: z.string().max(140),
  line1: z.string().max(60),
  line2: z.string().max(60),
  cutWords: z.array(z.string().min(1).max(24)).min(1).max(10),
  sub: z.string().max(220),
  primaryCta: z.object({ label: z.string(), href: z.string() }),
  secondaryCta: z.object({ label: z.string(), href: z.string() }),
  reelLabel: z.string().max(80).default("REEL 01 - N MADHU KUMAR"),
  aspectRatioLabel: z.string().max(20).default("2.39 : 1"),
  creditLine1: z.string().max(80).default("CUT BY N. MADHU KUMAR"),
  creditLine2: z.string().max(80).default("BENGALURU - 23.976 FPS"),
  footerLeftLabel: z.string().max(40).default("EST. 2023"),
  footerRightLabel: z.string().max(40).default("FRAME BY FRAME"),
  bgVideo: z.object({
    url: z.url(),
    poster: z.url().optional(),
    duotone: z.boolean().default(true),
  }),
});

export type Hero = z.infer<typeof HeroSchema>;
