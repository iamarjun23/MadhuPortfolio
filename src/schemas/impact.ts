import { z } from "zod";
import { MediaUrlSchema } from "./media";

export const ImpactSchema = z.object({
  heading: z.string().max(80).default("In the room with"),
  collaboratorsLabel: z.string().max(60).default("selected collaborators"),
  detailLabel: z.string().max(60).default("Selected collaboration"),
  stats: z
    .array(
      z.object({
        value: z.string().max(8),
        label: z.string().max(40),
      }),
    )
    .length(4),
  worked: z
    .array(
      z.object({
        name: z.string().max(60),
        context: z.string().max(60),
        image: z.object({ url: MediaUrlSchema, alt: z.string() }).nullable().default(null),
      }),
    )
    .max(60),
});

export type Impact = z.infer<typeof ImpactSchema>;
