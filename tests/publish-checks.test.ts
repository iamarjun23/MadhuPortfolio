import assert from "node:assert/strict";
import { test } from "node:test";
import { sectionData } from "../prisma/seed";
import { publishChecks } from "@/lib/publish-checks";

const failing = (input: Parameters<typeof publishChecks>[0]) =>
  publishChecks(input)
    .filter((check) => !check.ok)
    .map((check) => check.path);

test("publishChecks points at each section that needs attention", () => {
  const { resume, settings, work, contact } = structuredClone(sectionData);
  resume.pdf = null;
  settings.seo.ogImage = null;
  work.lanes[0]!.projects[0]!.href = null;
  work.lanes[0]!.projects[0]!.video = null;
  const about = { portrait: { url: "https://media.example/portrait.jpg", alt: " " } };

  assert.deepEqual(
    failing({ resume, settings, work, contact, drafts: [{ key: "about", data: about }] }),
    ["/resume", "/settings?open=seo", "/work", "/contact", "/about"],
  );
});

test("publishChecks passes a site with nothing missing", () => {
  const { resume, settings, work, contact } = structuredClone(sectionData);
  resume.pdf = { url: "https://media.example/resume.pdf" };
  settings.seo.ogImage = { url: "https://media.example/share.jpg" };
  for (const project of work.lanes.flatMap((lane) => lane.projects)) {
    project.href = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
  }
  contact.socials.whatsapp = "+91 90000 00000";

  assert.deepEqual(failing({ resume, settings, work, contact, drafts: [] }), []);
});
