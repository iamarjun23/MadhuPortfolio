"use server";

import { Prisma, Status } from "@/generated/prisma";
import { requireOwner } from "@/auth";
import { getDb } from "@/lib/db";
import { sectionSchemas } from "@/lib/studio-drafts";
import type { SectionKey } from "@/lib/sections";
import { studioSectionLabels } from "@/lib/studio-nav";

type DraftSaveResult =
  | Readonly<{ ok: true; data: unknown }>
  | Readonly<{ ok: false; error: string }>;

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
      return { ok: false, error: "Validation failed. Check the highlighted fields." };
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

    return { ok: true, data: parsed.data };
  } catch {
    return { ok: false, error: "Could not save this draft. Please try again." };
  }
}
