import { unstable_cache } from "next/cache";
import { Status } from "@/generated/prisma";
import { getDb } from "@/lib/db";
import { contentTag } from "@/lib/revalidate";
import type { SectionKey } from "@/lib/sections";
import { sectionData } from "../../prisma/seed";
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

export function getHero(status: Status = Status.PUBLISHED) {
  return getSection("hero", status, HeroSchema);
}

export function getAbout(status: Status = Status.PUBLISHED) {
  return getSection("about", status, AboutSchema);
}

export function getImpact(status: Status = Status.PUBLISHED) {
  return getSection("impact", status, ImpactSchema);
}

export function getWork(status: Status = Status.PUBLISHED) {
  return getSection("work", status, WorkSchema);
}

export function getBooth(status: Status = Status.PUBLISHED) {
  return getSection("booth", status, BoothSchema);
}

export function getPraise(status: Status = Status.PUBLISHED) {
  return getSection("praise", status, PraiseSchema);
}

export function getExperience(status: Status = Status.PUBLISHED) {
  return getSection("experience", status, ExperienceSchema);
}

export function getRoom(status: Status = Status.PUBLISHED) {
  return getSection("room", status, RoomSchema);
}

export function getContact(status: Status = Status.PUBLISHED) {
  return getSection("contact", status, ContactSchema);
}

export function getSettings(status: Status = Status.PUBLISHED) {
  return getSection("settings", status, SettingsSchema);
}
