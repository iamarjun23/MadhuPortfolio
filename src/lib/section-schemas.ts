import {
  AboutSchema,
  ClientsSchema,
  ContactSchema,
  ExperienceSchema,
  HeroSchema,
  ImpactSchema,
  PraiseSchema,
  ResumeSchema,
  RoomSchema,
  SettingsSchema,
  WorkSchema,
} from "@/schemas";

/* Kept free of database imports so the studio's editing panel can read a field's
   limits in the browser from the same schemas the server validates a save against. */
export const sectionSchemas = {
  hero: HeroSchema,
  about: AboutSchema,
  impact: ImpactSchema,
  clients: ClientsSchema,
  work: WorkSchema,
  praise: PraiseSchema,
  resume: ResumeSchema,
  experience: ExperienceSchema,
  room: RoomSchema,
  contact: ContactSchema,
  settings: SettingsSchema,
};
