import { z } from "zod";

type Path = readonly (string | number)[];

/* A field's limit sits on its innermost type, under whatever default, optional or
   nullable layers the schema wrapped it in. */
function unwrap(schema: z.core.$ZodType): z.core.$ZodType {
  if (
    schema instanceof z.ZodDefault ||
    schema instanceof z.ZodOptional ||
    schema instanceof z.ZodNullable
  ) {
    return unwrap(schema.unwrap());
  }
  return schema;
}

/* A drawing-room card is one of several shapes, so a step into it can land on more
   than one schema; every shape that has the key is followed. */
function step(schema: z.core.$ZodType, segment: string | number): z.core.$ZodType[] {
  const inner = unwrap(schema);
  if (inner instanceof z.ZodUnion) {
    return inner.options.flatMap((option: z.core.$ZodType) => step(option, segment));
  }
  if (typeof segment === "number") return inner instanceof z.ZodArray ? [inner.element] : [];
  if (!(inner instanceof z.ZodObject)) return [];
  const child: z.core.$ZodType | undefined = inner.shape[segment];
  return child ? [child] : [];
}

/**
 * The most a field may hold, read from the schema a save is validated against:
 * characters for a text field, entries for a list. Undefined when the schema sets
 * no limit, or the path is not in it.
 */
export function maxAtPath(schema: z.core.$ZodType, path: Path): number | undefined {
  let candidates = [schema];
  for (const segment of path) candidates = candidates.flatMap((entry) => step(entry, segment));

  for (const candidate of candidates) {
    const leaf = unwrap(candidate);
    if (leaf instanceof z.ZodString && leaf.maxLength !== null) return leaf.maxLength;
    if (leaf instanceof z.ZodArray) {
      const { maximum } = leaf._zod.bag;
      if (typeof maximum === "number") return maximum;
    }
  }
  return undefined;
}
