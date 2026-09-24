import { z } from "zod";
import { flagRepeatedIds } from "./item-id";
import { ImageUrlSchema } from "./media";

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
    .length(4)
    .superRefine((stats, ctx) => flagRepeated(stats, "label", ctx)),
  // No IDs here: the page keys collaborators by name, so a name may appear only once.
  worked: z
    .array(
      z.object({
        name: z.string().max(60),
        context: z.string().max(60),
        image: z.object({ url: ImageUrlSchema, alt: z.string() }).nullable().default(null),
      }),
    )
    .max(60)
    .superRefine((worked, ctx) => flagRepeated(worked, "name", ctx)),
});

function flagRepeated<K extends string>(
  items: readonly Readonly<Record<K, string>>[],
  field: K,
  ctx: z.RefinementCtx,
) {
  flagRepeatedIds(
    items.map((item, index) => ({ id: item[field], path: [index, field] })),
    ctx,
    field,
  );
}

export type Impact = z.infer<typeof ImpactSchema>;
