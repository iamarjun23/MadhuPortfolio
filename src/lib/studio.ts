import { Status } from "@/generated/prisma/client";
import { getBooth, getPraise, getWork } from "@/lib/content";
import { getDb, isDatabaseConfigured } from "@/lib/db";
import { sectionKeys } from "@/lib/sections";
import type { StudioShellData } from "@/lib/studio-nav";

export type { StudioShellData } from "@/lib/studio-nav";

export type StudioDashboardData = Readonly<{
  hasUnpublishedChanges: boolean;
  photos: number;
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

export async function hasPendingChanges() {
  if (!isDatabaseConfigured()) return false;

  const sections = await getDb().section.findMany({
    where: { key: { in: [...sectionKeys] } },
    select: { key: true, status: true, data: true },
  });

  return hasChangedDraft(sections);
}

export async function getStudioShellData(): Promise<StudioShellData> {
  const [work, booth, praise] = await Promise.all([getWork(), getBooth(), getPraise()]);

  if (!isDatabaseConfigured()) {
    return {
      badges: {
        work: work.lanes.length,
        booth: booth.slots.length,
        praise: praise.quotes.length,
      },
      hasUnpublishedChanges: false,
    };
  }

  return {
    badges: {
      work: work.lanes.length,
      booth: booth.slots.length,
      praise: praise.quotes.length,
    },
    hasUnpublishedChanges: await hasPendingChanges(),
  };
}

export async function getStudioDashboardData(): Promise<StudioDashboardData> {
  const [shellData, booth, praise, work] = await Promise.all([
    getStudioShellData(),
    getBooth(),
    getPraise(),
    getWork(),
  ]);
  const common = {
    hasUnpublishedChanges: shellData.hasUnpublishedChanges,
    photos: booth.slots.filter((slot) => slot.image !== null).length,
    testimonials: praise.quotes.length,
    workItems: work.lanes.reduce((total, lane) => total + lane.projects.length, 0),
  };

  if (!isDatabaseConfigured()) return { ...common, activity: [] };

  const activity = await getDb().activity.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, message: true, createdAt: true },
  });

  return { ...common, activity };
}
