import assert from "node:assert/strict";
import { test } from "node:test";
import { sectionTimeline } from "@/lib/section-timeline";

test("sectionTimeline numbers shown sections and skips hidden ones", () => {
  const timeline = sectionTimeline([
    ["about", true],
    ["praise", false],
    ["contact", true],
  ]);
  assert.deepEqual(timeline.get("about"), { index: 1, total: 2 });
  assert.equal(timeline.get("praise"), undefined);
  assert.deepEqual(timeline.get("contact"), { index: 2, total: 2 });
});
