import { unstable_cache } from "next/cache";
import { cache } from "react";
import { Status } from "@/generated/prisma/client";
import { getDb, isDatabaseConfigured } from "@/lib/db";
import { contentTag } from "@/lib/revalidate";
import { sectionKeys, type SectionKey } from "@/lib/sections";
import {
  AboutSchema,
  BoothSchema,
  ContactSchema,
  ExperienceSchema,
  HeroSchema,
  ImpactSchema,
  PraiseSchema,
  ProcessSchema,
  RoomSchema,
  SettingsSchema,
  WorkSchema,
} from "@/schemas";
import type { z } from "zod";

// A landing render asks for nine sections at once. Reading them one `findUnique` at a
// time meant nine queries in parallel, and because the adapter retires a connection
// after a single use (see db.ts) that opened nine Postgres connections per uncached
// render - nine TLS handshakes billed to the Worker's CPU budget, which is what tripped
// "Worker exceeded CPU time limit" on `/`. One `findMany` reads every section over a
// single connection instead.
//
// The batch carries every section's tag, so publishing any one section still refreshes
// it. That is coarser than a tag per entry, but a publish rewrites the whole draft
// anyway, and the reread it forces is now a single query rather than nine.
const readSections = (status: Status) =>
  unstable_cache(
    async () => {
      const sections = await getDb().section.findMany({
        where: { status },
        select: { key: true, data: true, updatedAt: true },
      });

      /* `updatedAt` rides along with the data rather than being read separately,
         so the studio editor's optimistic-locking version comes from the same
         snapshot as the content it is editing. Read apart, the cached data could
         be older than a freshly-read version, and a save carrying that pairing
         would pass the version check and quietly overwrite the newer write it
         never saw. Same snapshot means a stale pair fails closed instead. */
      return Object.fromEntries(
        sections.map((section) => [
          section.key,
          { data: section.data, version: section.updatedAt.toISOString() },
        ]),
      ) as Partial<Record<SectionKey, { data: unknown; version: string }>>;
    },
    ["sections", status],
    { tags: sectionKeys.map(contentTag) },
  )();

// Imported on demand: the seed module parses every section's defaults at module
// scope, so keeping it off the hot path saves that work.
export async function sectionDefaults(key: SectionKey): Promise<unknown> {
  const { sectionData } = await import("../../prisma/seed");
  return sectionData[key];
}

async function getSection<TSchema extends z.ZodType>(
  key: SectionKey,
  status: Status,
  schema: TSchema,
): Promise<z.output<TSchema>> {
  if (!isDatabaseConfigured()) {
    return schema.parse(await sectionDefaults(key));
  }

  const sections = await readSections(status);
  const entry = sections[key];

  // A section added after the database was seeded has no row of its own yet, and
  // a page is better served its shipped defaults than a 500. The row appears the
  // first time the section is saved or the site is published.
  if (entry === undefined) {
    return schema.parse(await sectionDefaults(key));
  }

  return schema.parse(entry.data);
}

/* The draft row's version, taken from the same cached read the draft content
   comes from - see the note in `readSections`. Null when the section has no
   draft row yet. */
export async function getSectionVersion(key: SectionKey, status: Status) {
  if (!isDatabaseConfigured()) return null;
  return (await readSections(status))[key]?.version ?? null;
}

// Memoised per request: a landing render asks for the settings section from
// generateMetadata, the layout and the page, and for contact from two of them.
// Without this each caller repeats the cache lookup and the schema decode.
export const getHero = cache((status: Status = Status.PUBLISHED) =>
  getSection("hero", status, HeroSchema),
);

export const getAbout = cache((status: Status = Status.PUBLISHED) =>
  getSection("about", status, AboutSchema),
);

export const getImpact = cache((status: Status = Status.PUBLISHED) =>
  getSection("impact", status, ImpactSchema),
);

export const getWork = cache((status: Status = Status.PUBLISHED) =>
  getSection("work", status, WorkSchema),
);

export const getBooth = cache((status: Status = Status.PUBLISHED) =>
  getSection("booth", status, BoothSchema),
);

export const getPraise = cache((status: Status = Status.PUBLISHED) =>
  getSection("praise", status, PraiseSchema),
);

export const getExperience = cache((status: Status = Status.PUBLISHED) =>
  getSection("experience", status, ExperienceSchema),
);

export const getProcess = cache((status: Status = Status.PUBLISHED) =>
  getSection("process", status, ProcessSchema),
);

export const getRoom = cache((status: Status = Status.PUBLISHED) =>
  getSection("room", status, RoomSchema),
);

export const getContact = cache((status: Status = Status.PUBLISHED) =>
  getSection("contact", status, ContactSchema),
);

export const getSettings = cache((status: Status = Status.PUBLISHED) =>
  getSection("settings", status, SettingsSchema),
);
