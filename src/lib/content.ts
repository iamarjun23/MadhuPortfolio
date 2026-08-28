import { unstable_cache } from "next/cache";
import { cache } from "react";
import { Status } from "@/generated/prisma";
import { getDb } from "@/lib/db";
import { contentTag } from "@/lib/revalidate";
import type { SectionKey } from "@/lib/sections";
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

async function getSection<TSchema extends z.ZodType>(
  key: SectionKey,
  status: Status,
  schema: TSchema,
): Promise<z.output<TSchema>> {
  const read = unstable_cache(
    async () => {
      if (!process.env.DATABASE_URL) {
        // Imported on demand: the seed module parses every section's defaults at
        // module scope, so keeping it off the configured path saves that work.
        const { sectionData } = await import("../../prisma/seed");
        return schema.parse(sectionData[key]);
      }

      const section = await getDb().section.findUnique({
        where: { key_status: { key, status } },
      });

      if (!section) {
        throw new Error(`Missing ${status.toLowerCase()} content for the ${key} section.`);
      }

      return schema.parse(section.data);
    },
    ["section", key, status],
    { tags: [contentTag(key)] },
  );

  return read();
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
