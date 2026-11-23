import assert from "node:assert/strict";
import { test } from "node:test";
import { hash } from "bcryptjs";
import { hashPassword, needsRehash, verifyPassword } from "@/lib/password";

test("a fresh hash verifies its own password and nothing else", async () => {
  const stored = await hashPassword("correct horse");
  assert.equal(await verifyPassword("correct horse", stored), true);
  assert.equal(await verifyPassword("wrong horse", stored), false);
  assert.equal(needsRehash(stored), false);
});

test("a legacy bcrypt hash still verifies and is flagged for rehash", async () => {
  const stored = await hash("correct horse", 4);
  assert.equal(await verifyPassword("correct horse", stored), true);
  assert.equal(await verifyPassword("wrong horse", stored), false);
  assert.equal(needsRehash(stored), true);
});

test("an older iteration count is flagged; one below the floor is refused", async () => {
  const [algorithm, , salt, derived] = (await hashPassword("correct horse")).split("$");
  assert.equal(needsRehash([algorithm, 100_000, salt, derived].join("$")), true);
  assert.equal(
    await verifyPassword("correct horse", [algorithm, 1, salt, derived].join("$")),
    false,
  );
});
