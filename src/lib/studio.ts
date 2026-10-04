import { cache } from "react";
import { Status } from "@/generated/prisma/client";
import { getContact, getResume, getSettings, getWork } from "@/lib/content";
import { getDb, isDatabaseConfigured } from "@/lib/db";
import { partEdited } from "@/lib/draft-diff";
import { publishChecks } from "@/lib/publish-checks";
import { sectionKeys } from "@/lib/sections";
import { editedLabels, type StudioShellData } from "@/lib/studio-nav";

export type { StudioShellData } from "@/lib/studio-nav";

export type StudioActivity = ReadonlyArray<{
  id: string;
  message: string;
  createdAt: Date;
}>;

/* Every section's draft and published row. Memoised per request: the layout and
   the Studio page both ask which parts are unpublished, and one read answers both. */
export const getSectionRows = cache(async () => {
  if (!isDatabaseConfigured()) return [];

  return getDb().section.findMany({
    where: { key: { in: [...sectionKeys] } },
    select: { key: true, status: true, data: true, updatedAt: true },
  });
});

export const hasPendingChanges = cache(async () => {
  const sections = await getSectionRows();
  return sectionKeys.some((key) => partEdited(sections, key));
});

/** What a visitor would notice is missing, checked against the drafts as they stand. */
export const getPublishChecks = cache(async () => {
  const [rows, resume, settings, work, contact] = await Promise.all([
    getSectionRows(),
    getResume(Status.DRAFT),
    getSettings(Status.DRAFT),
    getWork(Status.DRAFT),
    getContact(Status.DRAFT),
  ]);

  return publishChecks({
    resume,
    settings,
    work,
    contact,
    drafts: sectionKeys.flatMap((key) => {
      const draft = rows.find((row) => row.key === key && row.status === Status.DRAFT);
      return draft ? [{ key, data: draft.data }] : [];
    }),
  });
});

export async function getStudioShellData(): Promise<StudioShellData> {
  const [hasUnpublishedChanges, rows, checks] = await Promise.all([
    hasPendingChanges(),
    getSectionRows(),
    getPublishChecks(),
  ]);

  return {
    hasUnpublishedChanges,
    edited: editedLabels(rows),
    flagged: checks.flatMap((check) => (check.ok ? [] : [check.label])),
  };
}

/** The latest saves and publishes, newest first, for the Studio page. */
export async function getRecentActivity(): Promise<StudioActivity> {
  if (!isDatabaseConfigured()) return [];

  return getDb().activity.findMany({
    orderBy: { createdAt: "desc" },
    take: 12,
    select: { id: true, message: true, createdAt: true },
  });
}

/** How much the uploads in storage add up to, for the Studio page. */
export async function getStorageUsage() {
  if (!isDatabaseConfigured()) return { files: 0, bytes: 0 };

  const usage = await getDb().media.aggregate({
    where: { deletingAt: null },
    _count: true,
    _sum: { bytes: true },
  });
  return { files: usage._count, bytes: usage._sum.bytes ?? 0 };
}
