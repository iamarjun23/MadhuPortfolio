import { z } from "zod";

/** The key of one item in an editable list. The Studio edits items by it and the page renders
    them by it, so it must be present and must not change: the Studio mints a UUID once when an
    item is added, and seeded items use slugs. */
export const ItemIdSchema = z
  .string()
  .max(64)
  .regex(/^\S+$/, "Every item needs an ID with no spaces.");

type IdAt = Readonly<{ id: string; path: PropertyKey[] }>;

/** Flags every value that repeats one seen earlier, on the repeat's own path. */
export function flagRepeatedIds(entries: readonly IdAt[], ctx: z.RefinementCtx, what = "ID") {
  const seen = new Set<string>();
  for (const { id, path } of entries) {
    if (seen.has(id)) {
      ctx.addIssue({
        code: "custom",
        message: `Another item already uses the ${what} "${id}".`,
        path,
      });
    }
    seen.add(id);
  }
}

/** For a list's `.superRefine`: two items with one ID would edit and render as one. */
export function uniqueIds(items: readonly Readonly<{ id: string }>[], ctx: z.RefinementCtx) {
  flagRepeatedIds(
    items.map((item, index) => ({ id: item.id, path: [index, "id"] })),
    ctx,
  );
}
