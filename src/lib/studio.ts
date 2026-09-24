import { cache } from "react";
import { Status } from "@/generated/prisma/client";
import { getPraise, getWork } from "@/lib/content";
import { getDb, isDatabaseConfigured } from "@/lib/db";
import { sectionKeys } from "@/lib/sections";
import type { StudioShellData } from "@/lib/studio-nav";

export type { StudioShellData } from "@/lib/studio-nav";

export type StudioDashboardData = Readonly<{
  hasUnpublishedChanges: boolean;
  testimonials: number;
  workItems: number;
  activity: ReadonlyArray<{
    id: string;
    message: string;
    createdAt: Date;
  }>;
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

function hasChangedDraft(
  sections: ReadonlyArray<{
    key: string;
    status: Status;
    data: unknown;
  }>,
) {
  return sectionKeys.some((key) => {
    const draft = sections.find(
      (section) => section.key === key && section.status === Status.DRAFT,
    );
    const published = sections.find(
      (section) => section.key === key && section.status === Status.PUBLISHED,
    );

    return Boolean(draft && (!published || !jsonValuesEqual(draft.data, published.data)));
  });
}

export const hasPendingChanges = cache(async () => {
  if (!isDatabaseConfigured()) return false;

  const sections = await getDb().section.findMany({
    where: { key: { in: [...sectionKeys] } },
    select: { key: true, status: true, data: true },
  });

  return hasChangedDraft(sections);
});

// Counts come from the drafts, so they match what the owner is editing rather than
// lagging until the next publish.
export async function getStudioShellData(): Promise<StudioShellData> {
  const [work, praise, hasUnpublishedChanges] = await Promise.all([
    getWork(Status.DRAFT),
    getPraise(Status.DRAFT),
    hasPendingChanges(),
  ]);

  return {
    badges: {
      work: work.lanes.reduce((total, lane) => total + lane.projects.length, 0),
      praise: praise.quotes.length,
    },
    hasUnpublishedChanges,
  };
}

export async function getStudioDashboardData(): Promise<StudioDashboardData> {
  const shellData = await getStudioShellData();
  const common = {
    hasUnpublishedChanges: shellData.hasUnpublishedChanges,
    testimonials: shellData.badges.praise,
    workItems: shellData.badges.work,
  };

  if (!isDatabaseConfigured()) return { ...common, activity: [] };

  const activity = await getDb().activity.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, message: true, createdAt: true },
  });

  return { ...common, activity };
}
