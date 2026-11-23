import assert from "node:assert/strict";
import { test } from "node:test";
import type { SectionRow } from "@/lib/draft-diff";
import { editedLabels, foldRepeats } from "@/lib/studio-nav";

const settings = {
  seo: { title: "Old" },
  site: { brand: {}, navigation: { work: "Work" }, footer: {} },
};
const rows: SectionRow[] = [
  { key: "settings", status: "PUBLISHED", data: settings },
  {
    key: "settings",
    status: "DRAFT",
    data: { ...settings, seo: { title: "New" }, site: { ...settings.site, footer: { note: "x" } } },
  },
  { key: "room", status: "PUBLISHED", data: { teaser: { title: "Old" }, title: "Room" } },
  { key: "room", status: "DRAFT", data: { teaser: { title: "New" }, title: "Room" } },
];

test("editedLabels names each edited part once, by the tab or detail that owns it", () => {
  assert.deepEqual(editedLabels(rows), ["Room entrance", "Footer", "Google and sharing"]);
});

test("foldRepeats folds back-to-back repeats into the newest line", () => {
  const log = ["Work draft updated", "Work draft updated", "Site published", "Work draft updated"];
  assert.deepEqual(foldRepeats(log.map((message, id) => ({ id, message }))), [
    { id: 0, message: "Work draft updated", count: 2 },
    { id: 2, message: "Site published", count: 1 },
    { id: 3, message: "Work draft updated", count: 1 },
  ]);
});
