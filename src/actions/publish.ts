"use server";

import { revalidatePath } from "next/cache";
import { Prisma, Status } from "@prisma/client";
import { requireOwner } from "@/auth";
import { getDb } from "@/lib/db";
import { updateContent } from "@/lib/revalidate";
import { sectionKeys } from "@/lib/sections";
import type { PublishResult, RevertResult } from "@/actions/publish-types";

function toInputJsonValue(value: unknown): Prisma.InputJsonValue | null {
  if (value === null) return null;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  if (Array.isArray(value)) return value.map(toInputJsonValue);
  if (typeof value === "object") return toInputJson(value);
  throw new Error("Section data must be JSON serializable.");
}

function toInputJson(value: object): Prisma.InputJsonObject {
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [key, toInputJsonValue(entry)]),
  );
}

function toSectionInputJson(value: unknown): Prisma.InputJsonObject {
  if (value === null || Array.isArray(value) || typeof value !== "object") {
    throw new Error("Section data must be a JSON object.");
  }
  return toInputJson(value);
}

function revalidatePublishedContent() {
  for (const key of sectionKeys) updateContent(key);
  revalidatePath("/", "layout");
  revalidatePath("/room", "layout");
  revalidatePath("/studio", "layout");
}

export async function publishAll(): Promise<PublishResult> {
  try {
    const user = await requireOwner();
    const publishedSections = await getDb().$transaction(async (tx) => {
      const drafts = await tx.section.findMany({
        where: { key: { in: [...sectionKeys] }, status: Status.DRAFT },
      });
      const draftsByKey = new Map(drafts.map((draft) => [draft.key, draft]));

      if (draftsByKey.size !== sectionKeys.length) {
        throw new Error("Every section needs a draft before publishing.");
      }

      let count = 0;

      for (const key of sectionKeys) {
        const draft = draftsByKey.get(key);
        if (!draft) throw new Error(`Missing draft content for ${key}.`);

        await tx.section.upsert({
          where: { key_status: { key, status: Status.PUBLISHED } },
          create: {
            key,
            status: Status.PUBLISHED,
            data: toSectionInputJson(draft.data),
            updatedBy: user.id,
          },
          update: { data: toSectionInputJson(draft.data), updatedBy: user.id },
        });
        count += 1;
      }

      await tx.activity.create({
        data: { kind: "publish", section: "all", message: "Site published" },
      });
      return count;
    });

    revalidatePublishedContent();
    return { ok: true, publishedSections };
  } catch {
    return { ok: false, error: "Could not publish the site. Please try again." };
  }
}

export async function revertDraftsToPublished(): Promise<RevertResult> {
  try {
    const user = await requireOwner();
    const revertedSections = await getDb().$transaction(async (tx) => {
      const publishedSections = await tx.section.findMany({
        where: { key: { in: [...sectionKeys] }, status: Status.PUBLISHED },
      });
      const publishedByKey = new Map(publishedSections.map((section) => [section.key, section]));

      if (publishedByKey.size !== sectionKeys.length) {
        throw new Error("Every section needs published content before reverting drafts.");
      }

      let count = 0;

      for (const key of sectionKeys) {
        const published = publishedByKey.get(key);
        if (!published) throw new Error(`Missing published content for ${key}.`);

        await tx.section.upsert({
          where: { key_status: { key, status: Status.DRAFT } },
          create: {
            key,
            status: Status.DRAFT,
            data: toSectionInputJson(published.data),
            updatedBy: user.id,
          },
          update: { data: toSectionInputJson(published.data), updatedBy: user.id },
        });
        count += 1;
      }

      await tx.activity.create({
        data: {
          kind: "revert",
          section: "all",
          message: "Drafts reverted to the last published site",
        },
      });
      return count;
    });

    revalidatePublishedContent();
    return { ok: true, revertedSections };
  } catch {
    return { ok: false, error: "Could not revert drafts. Please try again." };
  }
}
