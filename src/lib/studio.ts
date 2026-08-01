import { Status } from "@/generated/prisma";
import { getBooth, getPraise, getWork } from "@/lib/content";
import { getDb } from "@/lib/db";
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

function hasNewerDraft(
  sections: ReadonlyArray<{
    key: string;
    status: Status;
    updatedAt: Date;
  }>,
) {
  return sectionKeys.some((key) => {
    const draft = sections.find(
      (section) => section.key === key && section.status === Status.DRAFT,
    );
    const published = sections.find(
      (section) => section.key === key && section.status === Status.PUBLISHED,
    );

    return Boolean(draft && (!published || draft.updatedAt > published.updatedAt));
  });
}

export async function hasPendingChanges() {
  if (!process.env.DATABASE_URL) return false;

  const sections = await getDb().section.findMany({
    where: { key: { in: [...sectionKeys] } },
    select: { key: true, status: true, updatedAt: true },
  });

  return hasNewerDraft(sections);
}

export async function getStudioShellData(): Promise<StudioShellData> {
  const [work, booth, praise] = await Promise.all([getWork(), getBooth(), getPraise()]);

  if (!process.env.DATABASE_URL) {
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

  if (!process.env.DATABASE_URL) return { ...common, activity: [] };

  const activity = await getDb().activity.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, message: true, createdAt: true },
  });

  return { ...common, activity };
}
