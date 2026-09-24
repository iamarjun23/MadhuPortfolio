import { z } from "zod";
import { ItemIdSchema, uniqueIds } from "./item-id";
import { ImageUrlSchema } from "./media";

export const PraiseSchema = z.object({
  visible: z.boolean().default(false),
  eyebrow: z.string().max(40).default("Praise"),
  heading: z.string().max(80).default("What people say"),
  sampleLabel: z.string().max(40).default("Sample quote"),
  quotes: z
    .array(
      z.object({
        id: ItemIdSchema,
        quote: z.string().max(280),
        name: z.string().max(60),
        role: z.string().max(60),
        initials: z.string().max(3),
        image: z.object({ url: ImageUrlSchema, alt: z.string() }).nullable().default(null),
        isSample: z.boolean().default(false),
      }),
    )
    .max(20)
    .superRefine(uniqueIds),
});

export type Praise = z.infer<typeof PraiseSchema>;
