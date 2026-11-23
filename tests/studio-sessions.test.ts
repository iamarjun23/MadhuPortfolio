import assert from "node:assert/strict";
import { test } from "node:test";
import { isLiveSession } from "@/lib/studio-sessions";

const now = new Date("2026-11-06T12:00:00Z");
const owner = { email: "owner@example.test", role: "OWNER" };
const later = new Date("2026-11-07T12:00:00Z");

test("a current row for the owner keeps the session", () => {
  assert.equal(isLiveSession({ expires: later, user: owner }, owner.email, now), true);
});

test("a deleted row (logout, password change) ends the session", () => {
  assert.equal(isLiveSession(null, owner.email, now), false);
});

test("an expired row ends the session, even if the cookie is still valid", () => {
  assert.equal(isLiveSession({ expires: now, user: owner }, owner.email, now), false);
});

test("a row for another email, or a user who is no longer owner, does not count", () => {
  assert.equal(isLiveSession({ expires: later, user: owner }, "other@example.test", now), false);
  assert.equal(
    isLiveSession({ expires: later, user: { ...owner, role: "VIEWER" } }, owner.email, now),
    false,
  );
});
