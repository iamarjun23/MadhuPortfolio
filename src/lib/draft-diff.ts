/* Which part of a section's draft one Studio tab edits. Several tabs share a draft
   (the navbar and the footer both live in the settings draft), so "has this changed
   since the last publish" is asked per part rather than per draft. */
export type DraftPart = Readonly<{
  /** Dot paths into the draft; the whole draft when left out. */
  only?: readonly string[];
  /** A top-level key that belongs to another tab. */
  except?: string;
}>;

export type SectionRow = Readonly<{
  key: string;
  status: "DRAFT" | "PUBLISHED";
  data: unknown;
}>;

function isJsonRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && !Array.isArray(value) && typeof value === "object";
}

function jsonValuesEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;

  if (Array.isArray(left) && Array.isArray(right)) {
    return (
      left.length === right.length &&
      left.every((value, index) => jsonValuesEqual(value, right[index]))
    );
  }

  if (!isJsonRecord(left) || !isJsonRecord(right)) return false;

  const leftKeys = Object.keys(left).sort();
  const rightKeys = Object.keys(right).sort();
  return (
    leftKeys.length === rightKeys.length &&
    leftKeys.every(
      (key, index) => key === rightKeys[index] && jsonValuesEqual(left[key], right[key]),
    )
  );
}

function valueAt(data: unknown, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>((value, key) => (isJsonRecord(value) ? value[key] : undefined), data);
}

function partOf(data: unknown, { only, except }: DraftPart): unknown {
  if (only) return only.map((path) => valueAt(data, path));
  if (except && isJsonRecord(data)) {
    return Object.fromEntries(Object.entries(data).filter(([key]) => key !== except));
  }
  return data;
}

/** Whether a section's draft, or one part of it, differs from what is published. */
export function partEdited(
  rows: readonly SectionRow[],
  section: string,
  part: DraftPart = {},
): boolean {
  const draft = rows.find((row) => row.key === section && row.status === "DRAFT");
  const published = rows.find((row) => row.key === section && row.status === "PUBLISHED");

  return Boolean(
    draft &&
    (!published || !jsonValuesEqual(partOf(draft.data, part), partOf(published.data, part))),
  );
}
