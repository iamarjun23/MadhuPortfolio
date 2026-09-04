import { z } from "zod";
import { MediaUrlSchema } from "./media";

export const BoothSchema = z.object({
  eyebrow: z.string().max(40).default("Photobooth"),
  heading: z.string().max(80).default("On set & in the room"),
  lightboxCloseLabel: z.string().max(30).default("Close"),
  lightboxPreviousLabel: z.string().max(30).default("Previous"),
  lightboxNextLabel: z.string().max(30).default("Next"),
  slots: z
    .array(
      z.object({
        id: z.string(),
        image: z.object({ url: MediaUrlSchema, alt: z.string() }).nullable(),
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
