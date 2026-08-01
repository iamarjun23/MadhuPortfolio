import { z } from "zod";

export const BoothSchema = z.object({
  slots: z
    .array(
      z.object({
        id: z.string(),
        image: z.object({ url: z.url(), alt: z.string() }).nullable(),
        title: z.string().max(60),
        subtitle: z.string().max(80),
        lightboxCaption: z.string().max(120),
        hasTape: z.boolean().default(false),
        tile: z.enum(["a", "b", "c", "d", "e", "f", "g", "h"]),
      }),
    )
    .max(20),
});

export type Booth = z.infer<typeof BoothSchema>;
