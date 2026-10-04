import { cache } from "react";
import { getDb, isDatabaseConfigured } from "@/lib/db";
import { partEdited } from "@/lib/draft-diff";
import { sectionKeys } from "@/lib/sections";
import type { StudioShellData } from "@/lib/studio-nav";

export type { StudioShellData } from "@/lib/studio-nav";

export type StudioActivity = ReadonlyArray<{
  id: string;
  message: string;
  createdAt: Date;
}>;

/* Every section's draft and published row. Memoised per request: the layout asks
   whether anything is unpublished and the Menu page asks which parts are, and one
   read answers both. */
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

export async function getStudioShellData(): Promise<StudioShellData> {
  return { hasUnpublishedChanges: await hasPendingChanges() };
}

/** The latest saves and publishes, newest first, for the Menu page. */
export async function getRecentActivity(): Promise<StudioActivity> {
  if (!isDatabaseConfigured()) return [];

  return getDb().activity.findMany({
    orderBy: { createdAt: "desc" },
    take: 6,
    select: { id: true, message: true, createdAt: true },
  });
}

/** How much the uploads in storage add up to, for the Menu page. */
export async function getStorageUsage() {
  if (!isDatabaseConfigured()) return { files: 0, bytes: 0 };

  const usage = await getDb().media.aggregate({
    where: { deletingAt: null },
    _count: true,
    _sum: { bytes: true },
  });
  return { files: usage._count, bytes: usage._sum.bytes ?? 0 };
}
