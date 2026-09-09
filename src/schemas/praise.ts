import { z } from "zod";

export const PraiseSchema = z.object({
  visible: z.boolean().default(false),
  eyebrow: z.string().max(40).default("Praise"),
  heading: z.string().max(80).default("What people say"),
  sampleLabel: z.string().max(40).default("Sample quote"),
  quotes: z
    .array(
      z.object({
        id: z.string(),
        quote: z.string().max(280),
        name: z.string().max(60),
        role: z.string().max(60),
        initials: z.string().max(3),
        isSample: z.boolean().default(false),
      }),
    )
    .max(20),
});

export type Praise = z.infer<typeof PraiseSchema>;
