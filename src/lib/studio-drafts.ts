import { Status } from "@/generated/prisma";
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
import {
  getAbout,
  getBooth,
  getContact,
  getExperience,
  getHero,
  getImpact,
  getPraise,
  getRoom,
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
  experience: ExperienceSchema,
  room: RoomSchema,
  contact: ContactSchema,
  settings: SettingsSchema,
};

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
    case "room":
      return getRoom(Status.DRAFT);
    case "contact":
      return getContact(Status.DRAFT);
    case "settings":
      return getSettings(Status.DRAFT);
  }
}
