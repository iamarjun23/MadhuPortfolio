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
        // Where the crop centres when the tile's aspect ratio cuts the photo down -
        // 0.5/0.5 is the middle, the safe default for anyone who never touches it.
        focalX: z.number().min(0).max(1).default(0.5),
        focalY: z.number().min(0).max(1).default(0.5),
        title: z.string().max(60),
        subtitle: z.string().max(80),
        lightboxCaption: z.string().max(120),
        hasTape: z.boolean().default(false),
        // How much of the 12-column wall this photo takes up, in grid units - the
        // owner's own call on which photos get to be big rather than a fixed preset.
        width: z.number().min(2).max(12).default(4),
        height: z.number().min(1).max(4).default(2),
      }),
    )
    .max(20),
});

export type Booth = z.infer<typeof BoothSchema>;
