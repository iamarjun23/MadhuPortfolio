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
  | Readonly<{ ok: true; data: unknown; version: string }>
  | Readonly<{ ok: false; error: string; conflict?: true }>;

/* Raised when the draft row moved under the editor that is trying to save it.
   Thrown rather than returned so it unwinds the transaction on the way out. */
class StaleDraftError extends Error {}

const STALE_DRAFT_MESSAGE =
  "This section was saved somewhere else - another tab or device - after you opened it. Reload the page to pick up that version, then make your changes again.";

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

/* `expectedVersion` is the draft's `updatedAt` as it stood when the editor loaded
   it, or null when the section had no draft row yet. The upsert this replaces was
   last-write-wins: the same section open in two tabs meant the later save quietly
   threw away everything the earlier one had written, with nothing shown either
   side. */
export async function saveDraft(
  section: SectionKey,
  data: unknown,
  expectedVersion: string | null,
): Promise<DraftSaveResult> {
  try {
    const user = await requireOwner();
    const parsed = sectionSchemas[section].safeParse(data);

    if (!parsed.success) {
      return { ok: false, error: describeValidationFailure(parsed.error) };
    }

    const saved = await getDb().$transaction(async (tx) => {
      const sectionData = toInputJson(parsed.data);
      let row: { updatedAt: Date };

      if (expectedVersion === null) {
        /* The editor loaded a section with no draft row. Creating rather than
           upserting leaves the unique key to refuse the write if a row has
           appeared since, instead of overwriting whatever it holds. */
        try {
          row = await tx.section.create({
            data: { key: section, status: Status.DRAFT, data: sectionData, updatedBy: user.id },
            select: { updatedAt: true },
          });
        } catch (error) {
          /* Only a unique-key collision means someone else created the row first.
             Catching everything here would have reported a dropped connection as
             "saved somewhere else - reload", sending the owner to reload over a
             fault that reloading does not fix. */
          if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            throw new StaleDraftError();
          }
          throw error;
        }
      } else {
        /* Reading the version and then writing would let two saves both read the
           same value and both pass the check. Matching on `updatedAt` inside the
           UPDATE makes the compare and the write a single statement, so exactly
           one of two concurrent saves can match a given version. */
        const { count } = await tx.section.updateMany({
          where: {
            key: section,
            status: Status.DRAFT,
            updatedAt: new Date(expectedVersion),
          },
          data: { data: sectionData, updatedBy: user.id },
        });
        if (count !== 1) throw new StaleDraftError();
        row = await tx.section.findUniqueOrThrow({
          where: { key_status: { key: section, status: Status.DRAFT } },
          select: { updatedAt: true },
        });
      }

      await tx.activity.create({
        data: {
          kind: "update",
          section,
          message: `${studioSectionLabels[section]} draft updated`,
        },
      });

      return row;
    });

    updateContent(section);

    return { ok: true, data: parsed.data, version: saved.updatedAt.toISOString() };
  } catch (error) {
    if (error instanceof StaleDraftError) {
      return { ok: false, error: STALE_DRAFT_MESSAGE, conflict: true };
    }
    return { ok: false, error: "Could not save this draft. Please try again." };
  }
}
