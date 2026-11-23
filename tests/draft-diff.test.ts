import assert from "node:assert/strict";
import { test } from "node:test";
import { partEdited, type SectionRow } from "@/lib/draft-diff";

const published = { seo: { title: "Old" }, site: { navigation: { work: "Work" }, footer: {} } };
const rows: SectionRow[] = [
  { key: "settings", status: "PUBLISHED", data: published },
  {
    key: "settings",
    status: "DRAFT",
    data: { ...published, site: { ...published.site, navigation: { work: "Films" } } },
  },
  { key: "hero", status: "DRAFT", data: { line: "Never published" } },
  { key: "about", status: "PUBLISHED", data: { heading: "No draft row" } },
];

test("partEdited reports only the part of a shared draft that changed", () => {
  assert.equal(partEdited(rows, "settings"), true);
  assert.equal(partEdited(rows, "settings", { only: ["site.navigation"] }), true);
  assert.equal(partEdited(rows, "settings", { only: ["site.footer"] }), false);
  assert.equal(partEdited(rows, "settings", { only: ["seo", "site.footer"] }), false);
  assert.equal(partEdited(rows, "settings", { except: "site" }), false);
  assert.equal(partEdited(rows, "settings", { except: "seo" }), true);
});

test("partEdited treats an unpublished draft as edited and a missing draft as live", () => {
  assert.equal(partEdited(rows, "hero"), true);
  assert.equal(partEdited(rows, "about"), false);
});
