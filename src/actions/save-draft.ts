"use server";

import { Prisma, Status } from "@/generated/prisma/client";
import { requireOwner } from "@/auth";
import { getDb } from "@/lib/db";
import { updateContent } from "@/lib/revalidate";
import { sectionSchemas } from "@/lib/studio-drafts";
import type { SectionKey } from "@/lib/sections";
import { fieldLabel } from "@/lib/studio-labels";
import { studioSectionLabels } from "@/lib/studio-nav";
import type { ZodError } from "zod";

type DraftSaveResult =
  Readonly<{ ok: true; data: unknown }> | Readonly<{ ok: false; error: string }>;

/* A refused save used to say only that validation failed, with nothing on the
   page marked, so the one bad field had to be hunted for. This names the fields
   the way the editing panel does - "Cards / Card 3 / Photo caption" - and quotes
   what the schema objected to. */
function describeValidationFailure(error: ZodError): string {
  const seen = new Set<string>();
  const problems: string[] = [];

  for (const issue of error.issues) {
    const where = issue.path.length > 0 ? readablePath(issue.path) : "This section";
    const line = `${where}: ${issue.message.toLocaleLowerCase()}`;
    if (seen.has(line)) continue;
    seen.add(line);
    problems.push(line);
    if (problems.length === 3) break;
  }

  const more = error.issues.length - problems.length;
  return `This draft could not be saved. ${problems.join(" · ")}${more > 0 ? ` · and ${more} more` : ""}`;
}

function readablePath(path: ReadonlyArray<PropertyKey>): string {
  const segments = path.filter(
    (segment): segment is string | number =>
      typeof segment === "string" || typeof segment === "number",
  );
  return segments.map((_, index) => fieldLabel(segments.slice(0, index + 1))).join(" / ");
}

function toInputJsonValue(value: unknown): Prisma.InputJsonValue | null {
  if (value === null) {
    return null;
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(toInputJsonValue);
  }

  if (typeof value === "object") {
    return toInputJson(value);
  }

  throw new Error("Section data must be JSON serializable.");
}

function toInputJson(value: object): Prisma.InputJsonObject {
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [key, toInputJsonValue(entry)]),
  );
}

export async function saveDraft(section: SectionKey, data: unknown): Promise<DraftSaveResult> {
  try {
    const user = await requireOwner();
    const parsed = sectionSchemas[section].safeParse(data);

    if (!parsed.success) {
      return { ok: false, error: describeValidationFailure(parsed.error) };
    }

    await getDb().$transaction(async (tx) => {
      await tx.section.upsert({
        where: { key_status: { key: section, status: Status.DRAFT } },
        create: {
          key: section,
          status: Status.DRAFT,
          data: toInputJson(parsed.data),
          updatedBy: user.id,
        },
        update: { data: toInputJson(parsed.data), updatedBy: user.id },
      });
      await tx.activity.create({
        data: {
          kind: "update",
          section,
          message: `${studioSectionLabels[section]} draft updated`,
        },
      });
    });

    updateContent(section);

    return { ok: true, data: parsed.data };
  } catch {
    return { ok: false, error: "Could not save this draft. Please try again." };
  }
}
