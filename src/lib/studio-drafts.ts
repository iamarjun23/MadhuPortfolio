import { Status } from "@/generated/prisma/client";
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
import {
  getAbout,
  getBooth,
  getContact,
  getExperience,
  getHero,
  getImpact,
  getPraise,
  getProcess,
  getRoom,
  getSectionVersion,
  getSettings,
  getWork,
} from "@/lib/content";
import type { SectionKey } from "@/lib/sections";

export const sectionSchemas = {
  hero: HeroSchema,
  about: AboutSchema,
  impact: ImpactSchema,
  work: WorkSchema,
  booth: BoothSchema,
  praise: PraiseSchema,
  process: ProcessSchema,
  experience: ExperienceSchema,
  room: RoomSchema,
  contact: ContactSchema,
  settings: SettingsSchema,
};

/* The draft row's `updatedAt` as the editor is about to load it. Sent back with
   the save so a write can be refused when the row moved in between; null means
   the section has no draft row yet. */
export async function getStudioDraftVersion(section: SectionKey): Promise<string | null> {
  return getSectionVersion(section, Status.DRAFT);
}

export async function getStudioDraft(section: SectionKey): Promise<unknown> {
  switch (section) {
    case "hero":
      return getHero(Status.DRAFT);
    case "about":
      return getAbout(Status.DRAFT);
    case "impact":
      return getImpact(Status.DRAFT);
    case "work":
      return getWork(Status.DRAFT);
    case "booth":
      return getBooth(Status.DRAFT);
    case "praise":
      return getPraise(Status.DRAFT);
    case "experience":
      return getExperience(Status.DRAFT);
    case "process":
      return getProcess(Status.DRAFT);
    case "room":
      return getRoom(Status.DRAFT);
    case "contact":
      return getContact(Status.DRAFT);
    case "settings":
      return getSettings(Status.DRAFT);
  }
}
