import { z } from "zod";

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
        image: z.object({ url: z.url(), alt: z.string() }).nullable(),
      }),
    )
    .max(60),
});

export type Impact = z.infer<typeof ImpactSchema>;
