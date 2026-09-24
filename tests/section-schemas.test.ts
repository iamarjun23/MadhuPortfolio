import assert from "node:assert/strict";
import { test } from "node:test";
import type { z } from "zod";
import { sectionData } from "../prisma/seed";
import {
  ExperienceSchema,
  ImpactSchema,
  PraiseSchema,
  RoomSchema,
  SettingsSchema,
  WorkSchema,
} from "@/schemas";
import { sectionSchemas } from "@/lib/studio-drafts";

/** The dotted paths of every issue, so a test can say exactly where a list broke. */
function issuePaths(schema: z.ZodType, data: unknown) {
  const result = schema.safeParse(data);
  return result.success ? [] : result.error.issues.map((issue) => issue.path.join("."));
}

test("the seed data parses for every section", () => {
  for (const [key, schema] of Object.entries(sectionSchemas)) {
    const data = sectionData[key as keyof typeof sectionData];
    assert.deepEqual(issuePaths(schema, data), [], key);
  }
});

test("a repeated item ID is refused on the repeat's own path", () => {
  const work = structuredClone(sectionData.work);
  work.lanes[1]!.id = work.lanes[0]!.id;
  assert.ok(issuePaths(WorkSchema, work).includes("lanes.1.id"));

  // Projects are addressed by ID alone, so a repeat in another lane still collides.
  const projects = structuredClone(sectionData.work);
  projects.lanes[1]!.projects[0]!.id = projects.lanes[0]!.projects[0]!.id;
  assert.ok(issuePaths(WorkSchema, projects).includes("lanes.1.projects.0.id"));

  const room = structuredClone(sectionData.room);
  room.cards[2]!.id = room.cards[0]!.id;
  assert.ok(issuePaths(RoomSchema, room).includes("cards.2.id"));

  const praise = structuredClone(sectionData.praise);
  praise.quotes[1]!.id = praise.quotes[0]!.id;
  assert.ok(issuePaths(PraiseSchema, praise).includes("quotes.1.id"));

  const experience = structuredClone(sectionData.experience);
  experience.roles[1]!.id = experience.roles[0]!.id;
  assert.ok(issuePaths(ExperienceSchema, experience).includes("roles.1.id"));

  const settings = structuredClone(sectionData.settings);
  const skills = settings.site.footer.skills;
  skills[1]!.id = skills[0]!.id;
  assert.ok(issuePaths(SettingsSchema, settings).includes("site.footer.skills.1.id"));
});

test("an ID must be present, short and free of spaces", () => {
  for (const bad of ["", "two words", "x".repeat(65)]) {
    const praise = structuredClone(sectionData.praise);
    praise.quotes[0]!.id = bad;
    assert.ok(issuePaths(PraiseSchema, praise).includes("quotes.0.id"), JSON.stringify(bad));
  }
});

test("impact names and stat labels must not repeat", () => {
  const names = structuredClone(sectionData.impact);
  names.worked[3]!.name = names.worked[0]!.name;
  assert.ok(issuePaths(ImpactSchema, names).includes("worked.3.name"));

  const stats = structuredClone(sectionData.impact);
  stats.stats[1]!.label = stats.stats[0]!.label;
  assert.ok(issuePaths(ImpactSchema, stats).includes("stats.1.label"));
});
