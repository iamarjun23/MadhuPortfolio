import { z } from "zod";

export const ImpactSchema = z.object({
  stats: z
    .array(
      z.object({
        value: z.string().max(8),
        label: z.string().max(40),
      }),
    )
    .length(4),
  worked: z.array(z.object({ name: z.string().max(60), context: z.string().max(60) })).max(60),
});

export type Impact = z.infer<typeof ImpactSchema>;
