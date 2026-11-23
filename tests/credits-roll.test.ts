import assert from "node:assert/strict";
import { test } from "node:test";
import { creditsFor, formatTimecode, runtimeSeconds } from "@/lib/credits-roll";

const base = {
  labels: ["About", "Work", "Contact"],
  availability: "Available for freelance",
  contactLabel: "Get in touch",
  secondsLeft: 6.2,
};

test("formatTimecode turns scroll distance into a 24fps timecode", () => {
  assert.equal(formatTimecode(0), "00:00:00:00");
  assert.equal(formatTimecode(-40), "00:00:00:00");
  assert.equal(formatTimecode(4 * 23), "00:00:00:23");
  assert.equal(formatTimecode(4 * 24), "00:00:01:00");
  assert.equal(formatTimecode(4 * 24 * 3661), "01:01:01:00");
  assert.equal(runtimeSeconds(4 * 24 * 3), 3);
});

test("creditsFor rolls the usual loop mid-section", () => {
  const roles = creditsFor({ ...base, index: 1, progress: 0.3 }).map((c) => c.role);
  assert.deepEqual(roles, ["Now showing", "Status", "Up next", "Runtime"]);
});

test("creditsFor drops the status credit when not available", () => {
  const credits = creditsFor({ ...base, availability: null, index: 1, progress: 0.3 });
  assert.equal(
    credits.some((c) => c.tone === "status"),
    false,
  );
});

test("creditsFor counts down to the next section near a section's end", () => {
  const credits = creditsFor({ ...base, index: 0, progress: 0.9 });
  assert.deepEqual(credits, [{ role: "Up next", value: "Work in 7s", tone: "countdown" }]);
});

test("creditsFor ends on the end credits in the last section", () => {
  const roles = creditsFor({ ...base, index: 2, progress: 0.95 }).map((c) => c.role);
  assert.deepEqual(roles, ["Fin.", "Status", "Next step"]);
  // Before the final stretch, the last section still rolls normally.
  assert.equal(creditsFor({ ...base, index: 2, progress: 0.5 })[0]?.role, "Now showing");
});

test("creditsFor is empty before the first section", () => {
  assert.deepEqual(creditsFor({ ...base, index: -1, progress: 0 }), []);
});
