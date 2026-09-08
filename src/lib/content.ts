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
        select: { key: true, data: true },
      });

      return Object.fromEntries(sections.map((section) => [section.key, section.data])) as Partial<
        Record<SectionKey, unknown>
      >;
    },
    ["sections", status],
    { tags: sectionKeys.map(contentTag) },
  )();

async function getSection<TSchema extends z.ZodType>(
  key: SectionKey,
  status: Status,
  schema: TSchema,
): Promise<z.output<TSchema>> {
  if (!isDatabaseConfigured()) {
    // Imported on demand: the seed module parses every section's defaults at
    // module scope, so keeping it off the configured path saves that work.
    const { sectionData } = await import("../../prisma/seed");
    return schema.parse(sectionData[key]);
  }

  const sections = await readSections(status);
  const data = sections[key];

  if (data === undefined) {
    throw new Error(`Missing ${status.toLowerCase()} content for the ${key} section.`);
  }

  return schema.parse(data);
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

export const getRoom = cache((status: Status = Status.PUBLISHED) =>
  getSection("room", status, RoomSchema),
);

export const getContact = cache((status: Status = Status.PUBLISHED) =>
  getSection("contact", status, ContactSchema),
);

export const getSettings = cache((status: Status = Status.PUBLISHED) =>
  getSection("settings", status, SettingsSchema),
);
